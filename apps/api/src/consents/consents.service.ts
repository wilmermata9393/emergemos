import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

const STANDARD_TYPES: ConsentType[] = [
  ConsentType.ELECTRONIC_RECORD_USE,
  ConsentType.HIPAA,
  ConsentType.PATIENT_RIGHTS_RESPONSIBILITIES,
  ConsentType.CYBERSECURITY,
];

@Injectable()
export class ConsentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  async patientIdOf(userId: string): Promise<string> {
    const p = await this.prisma.patient.findUnique({ where: { userId }, select: { id: true } });
    if (!p) throw new NotFoundException('No hay registro de paciente para esta cuenta.');
    return p.id;
  }

  listDocuments() {
    return this.prisma.consentDocument.findMany({ where: { isActive: true }, orderBy: { type: 'asc' } });
  }

  private activeDocForType(type: ConsentType) {
    return this.prisma.consentDocument.findFirst({ where: { type, isActive: true } });
  }

  /// Asigna un consentimiento (pendiente) de un documento, si no existe ya uno
  /// de ese tipo para el paciente. Devuelve true si lo creó.
  private async assignDocument(patientId: string, documentId: string): Promise<boolean> {
    const doc = await this.prisma.consentDocument.findUnique({ where: { id: documentId } });
    if (!doc) return false;
    const existing = await this.prisma.consent.findFirst({ where: { patientId, type: doc.type } });
    if (existing) return false;
    await this.prisma.consent.create({
      data: { patientId, type: doc.type, documentId: doc.id, documentVersion: doc.version },
    });
    return true;
  }

  /// Envío automático de los consentimientos estándar (al crear el paciente).
  async assignStandard(patientId: string) {
    let count = 0;
    for (const type of STANDARD_TYPES) {
      const doc = await this.activeDocForType(type);
      if (doc && (await this.assignDocument(patientId, doc.id))) count++;
    }
    return { assigned: count };
  }

  listForPatient(patientId: string) {
    return this.prisma.consent.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' },
      include: { document: { select: { title: true, type: true } } },
    });
  }

  async getForSigning(id: string, patientId: string) {
    const consent = await this.prisma.consent.findUnique({ where: { id }, include: { document: true } });
    if (!consent || consent.patientId !== patientId) throw new NotFoundException('Consentimiento no encontrado.');
    return consent;
  }

  /// Firma remota: guarda la imagen de la firma (cifrada), fecha/hora e IP.
  async sign(id: string, patientId: string, signatureName: string, signatureImage: string, ip?: string) {
    const consent = await this.getForSigning(id, patientId);
    if (consent.signedAt) throw new BadRequestException('Este consentimiento ya está firmado.');
    if (!signatureName?.trim()) throw new BadRequestException('Falta el nombre de la firma.');

    let signatureImageKey: string | undefined;
    if (signatureImage) {
      const base64 = signatureImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const stored = await this.files.save(
        { buffer, mimetype: 'image/png', originalname: `firma-${id}.png`, size: buffer.length },
        undefined,
      );
      signatureImageKey = stored.id;
    }

    return this.prisma.consent.update({
      where: { id },
      data: { signedAt: new Date(), signatureName: signatureName.trim(), signatureImageKey, ipAddress: ip },
    });
  }

  // ---- Evaluación inicial ----
  async submitInitialAssessment(patientId: string, answers: Record<string, unknown>) {
    const triggered: string[] = [];

    // Regla: si usa/recibe sustancias controladas → consentimiento adicional.
    if (answers?.['controlledSubstances'] === true || answers?.['controlledSubstances'] === 'yes') {
      const created = await this.assignDocument(patientId, 'doc-controlled-substances');
      if (created) triggered.push('Consentimiento para tratamiento con sustancias controladas');
    }

    await this.prisma.initialAssessment.create({
      data: { patientId, answers: answers as any, triggered: triggered as any },
    });
    return { triggered };
  }
}
