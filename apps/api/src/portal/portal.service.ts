import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { decryptField } from '../common/crypto.util';
import { CreateDiaryDto } from './dto/diary.dto';
import { UpdateMyProfileDto } from './dto/profile.dto';

type UploadedFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  /// Resuelve el paciente a partir del usuario logueado (dueño del portal).
  async patientIdOf(userId: string): Promise<string> {
    const p = await this.prisma.patient.findUnique({ where: { userId }, select: { id: true } });
    if (!p) throw new NotFoundException('No hay un registro de paciente para esta cuenta.');
    return p.id;
  }

  async myProfile(userId: string) {
    const p = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true, email: true, pronoun: true } },
        insuranceCards: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!p) throw new NotFoundException('Registro de paciente no encontrado.');
    // El número de miembro es PHI cifrado: se descifra para mostrárselo a su dueño.
    const insuranceCards = p.insuranceCards.map((c) => ({
      id: c.id,
      planName: c.planName,
      memberId: decryptField(c.memberId),
      hasFront: !!c.frontImageKey,
      hasBack: !!c.backImageKey,
      createdAt: c.createdAt,
    }));
    return { ...p, insuranceCards, hasAvatar: !!p.avatarFileId };
  }

  /// Edición restringida del propio perfil: SOLO teléfono, correo y dirección.
  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Registro de paciente no encontrado.');

    const userData: Record<string, unknown> = {};
    if (dto.phone !== undefined) userData.phone = dto.phone;
    if (dto.email !== undefined) userData.email = dto.email || null;

    const patientData: Record<string, unknown> = {};
    for (const k of ['addressLine', 'city', 'state', 'zip'] as const) {
      if (dto[k] !== undefined) patientData[k] = dto[k];
    }

    return this.prisma.patient.update({
      where: { id: patient.id },
      data: { ...patientData, ...(Object.keys(userData).length ? { user: { update: userData } } : {}) },
      include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } },
    });
  }

  /// Guarda/reemplaza la foto de perfil del paciente.
  async setAvatar(userId: string, file: UploadedFile) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) throw new NotFoundException('Registro de paciente no encontrado.');
    const stored = await this.files.save(file, userId);
    await this.prisma.patient.update({ where: { id: patient.id }, data: { avatarFileId: stored.id } });
    return { ok: true };
  }

  /// Id del archivo de la foto de perfil (para servirla).
  async avatarFileId(userId: string): Promise<string> {
    const p = await this.prisma.patient.findUnique({ where: { userId }, select: { avatarFileId: true } });
    if (!p?.avatarFileId) throw new NotFoundException('Sin foto de perfil.');
    return p.avatarFileId;
  }

  /// Id del archivo de una imagen de tarjeta del plan (frente o dorso), del propio paciente.
  async insuranceImageFileId(userId: string, cardId: string, side: 'front' | 'back'): Promise<string> {
    const patientId = await this.patientIdOf(userId);
    const card = await this.prisma.insuranceCard.findUnique({ where: { id: cardId } });
    if (!card || card.patientId !== patientId) throw new NotFoundException('Tarjeta no encontrada.');
    const key = side === 'front' ? card.frontImageKey : card.backImageKey;
    if (!key) throw new NotFoundException('Sin imagen.');
    return key;
  }

  // ---- Diario ----

  async listDiary(userId: string) {
    const patientId = await this.patientIdOf(userId);
    return this.prisma.diaryEntry.findMany({
      where: { patientId },
      orderBy: { entryAt: 'desc' },
    });
  }

  async createDiary(userId: string, dto: CreateDiaryDto) {
    const patientId = await this.patientIdOf(userId);
    return this.prisma.diaryEntry.create({
      data: {
        patientId,
        entryAt: dto.entryAt ? new Date(dto.entryAt) : new Date(),
        symptoms: dto.symptoms,
        medications: dto.medications,
        mood: dto.mood,
        notes: dto.notes,
      },
    });
  }

  // ---- Documentos propios ----

  async listDocuments(userId: string) {
    const patientId = await this.patientIdOf(userId);
    return this.prisma.patientDocument.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { file: { select: { mimeType: true, originalName: true, size: true } } },
    });
  }

  async uploadDocument(userId: string, file: UploadedFile, meta: { title: string; category?: DocumentCategory }) {
    const patientId = await this.patientIdOf(userId);
    const stored = await this.files.save(file, userId);
    return this.prisma.patientDocument.create({
      data: {
        patientId,
        fileId: stored.id,
        title: meta.title,
        category: meta.category ?? DocumentCategory.OTHER,
        uploadedById: userId,
      },
    });
  }
}
