import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Discipline, NoteStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  /// Nombre completo del usuario, para guardarlo junto a la firma.
  private async actorName(id: string): Promise<string> {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { firstName: true, lastName: true },
    });
    return u ? `${u.firstName} ${u.lastName}` : 'Desconocido';
  }

  /// Lista de plantillas disponibles (opcionalmente filtradas por disciplina).
  listTemplates(discipline?: Discipline) {
    return this.prisma.noteTemplate.findMany({
      where: { isActive: true, ...(discipline ? { discipline } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  /// Crea una plantilla personalizada (nombre, disciplina y secciones).
  createTemplate(data: {
    name: string;
    description?: string;
    discipline?: Discipline;
    sections: { key: string; title: string; type: string }[];
  }) {
    return this.prisma.noteTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        discipline: data.discipline ?? null,
        isSystem: false,
        schema: { sections: data.sections } as any,
      },
    });
  }

  /// Crea una nota en estado BORRADOR.
  async create(patientId: string, dto: CreateNoteDto, authorId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Paciente no encontrado.');

    if (dto.templateId) {
      const tpl = await this.prisma.noteTemplate.findUnique({ where: { id: dto.templateId } });
      if (!tpl) throw new BadRequestException('La plantilla indicada no existe.');
    }

    return this.prisma.clinicalNote.create({
      data: {
        patientId,
        authorId,
        templateId: dto.templateId ?? null,
        title: dto.title,
        content: (dto.content ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  listByPatient(patientId: string) {
    return this.prisma.clinicalNote.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true } }, template: { select: { name: true } } },
    });
  }

  async findOne(id: string) {
    const note = await this.prisma.clinicalNote.findUnique({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true } },
        template: true,
        versions: { orderBy: { version: 'desc' } },
      },
    });
    if (!note) throw new NotFoundException('Nota no encontrada.');
    return note;
  }

  /// Edita el contenido. Si la nota es BORRADOR, edición libre (solo autor).
  /// Si ya está FIRMADA, crea una ENMIENDA (requiere motivo) y sube de versión.
  async update(id: string, dto: UpdateNoteDto, actorId: string) {
    const note = await this.prisma.clinicalNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada.');
    if (note.authorId !== actorId) {
      throw new ForbiddenException('Solo el autor puede editar esta nota.');
    }

    // Borrador: simplemente actualiza.
    if (note.status === NoteStatus.DRAFT) {
      return this.prisma.clinicalNote.update({
        where: { id },
        data: {
          title: dto.title ?? note.title,
          content: dto.content as Prisma.InputJsonValue,
        },
      });
    }

    // Firmada: es una enmienda. Debe indicar el motivo.
    if (!dto.changeReason || !dto.changeReason.trim()) {
      throw new BadRequestException(
        'La nota ya está firmada. Para modificarla debes indicar el motivo del cambio (enmienda).',
      );
    }
    const newVersion = note.version + 1;
    const signedAt = new Date();
    const name = await this.actorName(actorId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.clinicalNote.update({
        where: { id },
        data: {
          title: dto.title ?? note.title,
          content: dto.content as Prisma.InputJsonValue,
          version: newVersion,
          signedAt,
          signedById: actorId,
          signedByName: name,
        },
      }),
      this.prisma.noteVersion.create({
        data: {
          noteId: id,
          version: newVersion,
          content: dto.content as Prisma.InputJsonValue,
          signedById: actorId,
          signedByName: name,
          signedAt,
          changeReason: dto.changeReason.trim(),
        },
      }),
    ]);
    return updated;
  }

  /// Firma la nota (solo el autor). La bloquea y guarda la versión 1.
  async sign(id: string, actorId: string) {
    const note = await this.prisma.clinicalNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada.');
    if (note.authorId !== actorId) {
      throw new ForbiddenException('Solo el autor de la nota puede firmarla.');
    }
    if (note.status === NoteStatus.SIGNED) {
      throw new BadRequestException('La nota ya está firmada.');
    }

    const signedAt = new Date();
    const name = await this.actorName(actorId);
    const [signed] = await this.prisma.$transaction([
      this.prisma.clinicalNote.update({
        where: { id },
        data: {
          status: NoteStatus.SIGNED,
          version: 1,
          signedAt,
          signedById: actorId,
          signedByName: name,
        },
      }),
      this.prisma.noteVersion.create({
        data: {
          noteId: id,
          version: 1,
          content: note.content as Prisma.InputJsonValue,
          signedById: actorId,
          signedByName: name,
          signedAt,
        },
      }),
    ]);
    return signed;
  }

  listVersions(id: string) {
    return this.prisma.noteVersion.findMany({
      where: { noteId: id },
      orderBy: { version: 'desc' },
    });
  }
}
