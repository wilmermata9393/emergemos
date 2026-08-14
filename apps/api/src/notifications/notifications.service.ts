import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: string;
  /// A dónde llevar al tocar la notificación push (ej. '/messages').
  url?: string;
  /// Si se repite, no crea duplicado.
  dedupeKey?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {}

  /// Crea una notificación (canal in-app) y la despacha a canales externos.
  async notify(input: NotifyInput) {
    if (input.dedupeKey) {
      const existing = await this.prisma.notification.findUnique({ where: { dedupeKey: input.dedupeKey } });
      if (existing) return existing; // ya se envió, no duplicar
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        relatedId: input.relatedId,
        dedupeKey: input.dedupeKey,
      },
    });

    // Canales externos (email/SMS): listos para conectar un proveedor con BAA.
    await this.dispatchExternal(input.userId, input.title, input.body);
    // Push del navegador (llega aunque la app esté cerrada, si hay suscripción).
    await this.push.sendToUser(input.userId, { title: input.title, body: input.body, url: input.url });
    return notification;
  }

  /// Adaptadores de email/SMS. Hoy solo registran en consola (demo). En
  /// producción, reemplazar por SendGrid/SES (email) y Twilio (SMS) con BAA.
  private async dispatchExternal(userId: string, title: string, body: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });
    if (!user) return;
    if (user.email) this.logger.log(`[EMAIL stub] a ${user.email}: ${title} — ${body}`);
    if (user.phone) this.logger.log(`[SMS stub] a ${user.phone}: ${title}`);
  }

  /// Difunde un anuncio/promoción a un grupo de pacientes.
  ///  - ALL: todos los pacientes con cuenta activa.
  ///  - SERVICE: solo los pacientes que han recibido/tienen ese servicio.
  async broadcast(input: { title: string; body: string; audience: 'ALL' | 'SERVICE'; serviceId?: string }) {
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

    const stamp = Date.now();
    for (const uid of userIds) {
      await this.notify({
        userId: uid,
        type: NotificationType.GENERAL,
        title: input.title,
        body: input.body,
        dedupeKey: `bcast-${stamp}-${uid}`,
      });
    }
    this.logger.log(`Anuncio difundido a ${userIds.length} paciente(s).`);
    return { sent: userIds.length };
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new NotFoundException('Notificación no encontrada.');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  /// Marca como leídos los avisos de tipo MENSAJE (al abrir la bandeja de mensajes).
  async markMessagesRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, type: NotificationType.MESSAGE, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
