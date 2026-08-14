import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole, DocumentCategory, PatientStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { ConsentsService } from '../consents/consents.service';
import { encryptField, decryptField } from '../common/crypto.util';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

type UploadedFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly consents: ConsentsService,
  ) {}

  /// Crea la cuenta de acceso (User) y el registro clínico (Patient) juntos.
  async create(dto: CreatePatientDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese teléfono.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const mrn = await this.generateUniqueMrn();

    const patient = await this.prisma.patient.create({
      data: {
        mrn,
        dateOfBirth: new Date(dto.dateOfBirth),
        sex: dto.sex,
        user: {
          create: {
            role: UserRole.PATIENT,
            phone: dto.phone,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            pronoun: dto.pronoun,
          },
        },
      },
      include: { user: { select: { firstName: true, lastName: true, phone: true } } },
    });

    // Envío automático de los consentimientos estándar al crear el paciente.
    await this.consents.assignStandard(patient.id);

    return patient;
  }

  /// Auto-registro del paciente (público). Queda PENDING e inactivo hasta que
  /// el equipo lo apruebe.
  async selfRegister(dto: CreatePatientDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('Ya existe una cuenta con ese teléfono.');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const mrn = await this.generateUniqueMrn();
    const patient = await this.prisma.patient.create({
      data: {
        mrn,
        dateOfBirth: new Date(dto.dateOfBirth),
        sex: dto.sex,
        status: PatientStatus.PENDING,
        user: {
          create: {
            role: UserRole.PATIENT,
            phone: dto.phone,
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            pronoun: dto.pronoun,
            isActive: false, // sin acceso hasta ser aprobado
          },
        },
      },
    });
    await this.consents.assignStandard(patient.id);
    return { ok: true, message: 'Registro recibido. Tu cuenta está pendiente de aprobación.' };
  }

  listPending() {
    return this.prisma.patient.findMany({
      where: { status: PatientStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } },
    });
  }

  /// Aprueba o rechaza un paciente auto-registrado.
  async setApproval(id: string, approve: boolean) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');
    await this.prisma.$transaction([
      this.prisma.patient.update({ where: { id }, data: { status: approve ? PatientStatus.ACTIVE : PatientStatus.REJECTED } }),
      this.prisma.user.update({ where: { id: patient.userId }, data: { isActive: approve } }),
    ]);
    return { id, status: approve ? 'ACTIVE' : 'REJECTED' };
  }

  /// Devuelve el registro de un paciente (sin datos sensibles de la cuenta).
  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true, phone: true, email: true, pronoun: true, isActive: true },
        },
      },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');
    return patient;
  }

  /// Actualiza demográficos: reparte los campos entre la cuenta (User) y el
  /// registro clínico (Patient).
  async update(id: string, dto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');

    const userData: Record<string, unknown> = {};
    if (dto.firstName !== undefined) userData.firstName = dto.firstName;
    if (dto.lastName !== undefined) userData.lastName = dto.lastName;
    if (dto.pronoun !== undefined) userData.pronoun = dto.pronoun;
    if (dto.email !== undefined) userData.email = dto.email || null;

    const patientData: Record<string, unknown> = {};
    for (const k of ['sex', 'addressLine', 'city', 'state', 'zip', 'emergencyContactName', 'emergencyContactPhone'] as const) {
      if (dto[k] !== undefined) patientData[k] = dto[k];
    }

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...patientData,
        ...(Object.keys(userData).length ? { user: { update: userData } } : {}),
      },
      include: { user: { select: { firstName: true, lastName: true, phone: true, email: true, pronoun: true } } },
    });
  }

  // ---- Plan médico (tarjeta de seguro) ----

  async uploadInsuranceCard(
    patientId: string,
    front: UploadedFile | undefined,
    back: UploadedFile | undefined,
    meta: { planName?: string; memberId?: string },
    uploadedById?: string,
  ) {
    await this.assertPatient(patientId);
    const frontFile = front ? await this.files.save(front, uploadedById) : null;
    const backFile = back ? await this.files.save(back, uploadedById) : null;
    return this.prisma.insuranceCard.create({
      data: {
        patientId,
        planName: meta.planName,
        // El número de miembro es PHI: se guarda cifrado (AES-256-GCM).
        memberId: encryptField(meta.memberId),
        frontImageKey: frontFile?.id,
        backImageKey: backFile?.id,
      },
    });
  }

  async listInsuranceCards(patientId: string) {
    const cards = await this.prisma.insuranceCard.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
    // Descifrar el número de miembro para mostrarlo.
    return cards.map((c) => ({ ...c, memberId: decryptField(c.memberId) }));
  }

  // ---- Documentos ----

  async uploadDocument(
    patientId: string,
    file: UploadedFile,
    meta: { title: string; category?: DocumentCategory },
    uploadedById?: string,
  ) {
    await this.assertPatient(patientId);
    const stored = await this.files.save(file, uploadedById);
    return this.prisma.patientDocument.create({
      data: {
        patientId,
        fileId: stored.id,
        title: meta.title,
        category: meta.category ?? DocumentCategory.OTHER,
        uploadedById,
      },
    });
  }

  listDocuments(patientId: string) {
    return this.prisma.patientDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { file: { select: { mimeType: true, originalName: true, size: true } } },
    });
  }

  private async assertPatient(id: string) {
    const p = await this.prisma.patient.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Paciente no encontrado.');
  }

  /// Lista de pacientes con búsqueda opcional por nombre, teléfono o MRN.
  async list(q?: string) {
    const term = q?.trim();
    return this.prisma.patient.findMany({
      where: term
        ? {
            OR: [
              { mrn: { contains: term, mode: 'insensitive' } },
              { user: { firstName: { contains: term, mode: 'insensitive' } } },
              { user: { lastName: { contains: term, mode: 'insensitive' } } },
              { user: { phone: { contains: term } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, phone: true, isActive: true } } },
    });
  }

  /// Archiva (desactiva) o reactiva la cuenta del paciente. No borra el récord
  /// (retención de datos clínicos).
  async setActive(id: string, active: boolean) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');
    await this.prisma.user.update({ where: { id: patient.userId }, data: { isActive: active } });
    return { id, active };
  }

  /// Genera un número de récord médico único y legible (ej. MRN-482013).
  private async generateUniqueMrn(): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const candidate = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
      const clash = await this.prisma.patient.findUnique({ where: { mrn: candidate } });
      if (!clash) return candidate;
    }
    // Respaldo extremadamente improbable.
    return `MRN-${Date.now()}`;
  }
}
