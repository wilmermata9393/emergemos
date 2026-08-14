import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateDiaryDto } from './dto/diary.dto';

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
      include: { user: { select: { firstName: true, lastName: true, phone: true, email: true, pronoun: true } } },
    });
    if (!p) throw new NotFoundException('Registro de paciente no encontrado.');
    return p;
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
