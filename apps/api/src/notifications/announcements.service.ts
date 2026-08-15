import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { NotificationsService } from './notifications.service';

type UploadedFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

interface CreateAnnouncement {
  title: string;
  body: string;
  terms?: string;
  audience: 'ALL' | 'SERVICE';
  serviceId?: string;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
  ) {}

  /// Crea el anuncio (con arte opcional) y lo difunde a la audiencia elegida.
  async createAndBroadcast(input: CreateAnnouncement, image: UploadedFile | undefined, createdById?: string) {
    let imageFileId: string | undefined;
    if (image) {
      const stored = await this.files.save(image, createdById);
      imageFileId = stored.id;
    }

    const ann = await this.prisma.announcement.create({
      data: { title: input.title, body: input.body, terms: input.terms || null, imageFileId },
    });

    // Audiencia.
    let userIds: string[] = [];
    if (input.audience === 'SERVICE' && input.serviceId) {
      const appts = await this.prisma.appointment.findMany({
        where: { serviceId: input.serviceId, patient: { user: { isActive: true } } },
        select: { patient: { select: { userId: true } } },
      });
      userIds = [...new Set(appts.map((a) => a.patient.userId))];
    } else {
      const patients = await this.prisma.patient.findMany({
        where: { user: { isActive: true } },
        select: { userId: true },
      });
      userIds = patients.map((p) => p.userId);
    }

    for (const uid of userIds) {
      await this.notifications.notify({
        userId: uid,
        type: NotificationType.GENERAL,
        title: input.title,
        body: input.body,
        relatedId: ann.id,
        url: `/announcements/${ann.id}`,
      });
    }
    return { id: ann.id, sent: userIds.length };
  }

  async getOne(id: string) {
    const ann = await this.prisma.announcement.findUnique({ where: { id } });
    if (!ann) throw new NotFoundException('Anuncio no encontrado.');
    return { id: ann.id, title: ann.title, body: ann.body, terms: ann.terms, hasImage: !!ann.imageFileId, createdAt: ann.createdAt };
  }

  async imageFileId(id: string): Promise<string> {
    const ann = await this.prisma.announcement.findUnique({ where: { id }, select: { imageFileId: true } });
    if (!ann?.imageFileId) throw new NotFoundException('Sin imagen.');
    return ann.imageFileId;
  }
}
