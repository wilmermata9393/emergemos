import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageCategory, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface Sender {
  id: string;
  role: UserRole;
}

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async name(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    return u ? `${u.firstName} ${u.lastName}` : 'Desconocido';
  }

  /// Crea avisos por un mensaje nuevo: si escribe el paciente, avisa al equipo;
  /// si escribe el equipo, avisa al paciente.
  private async notifyNewMessage(threadId: string, sender: Sender, senderName: string, body: string) {
    const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body;
    if (sender.role === UserRole.PATIENT) {
      const staff = await this.prisma.user.findMany({
        where: { isActive: true, role: { in: [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER] } },
        select: { id: true },
      });
      for (const s of staff) {
        await this.notifications.notify({
          userId: s.id, type: NotificationType.MESSAGE,
          title: 'Nuevo mensaje de un paciente', body: `${senderName}: ${preview}`, relatedId: threadId, url: '/messages',
        });
      }
    } else {
      const thread = await this.prisma.messageThread.findUnique({
        where: { id: threadId }, include: { patient: { select: { userId: true } } },
      });
      if (thread) {
        await this.notifications.notify({
          userId: thread.patient.userId, type: NotificationType.MESSAGE,
          title: 'Nuevo mensaje de tu equipo de salud', body: `${senderName}: ${preview}`, relatedId: threadId, url: '/portal/messages',
        });
      }
    }
  }

  /// Crea un hilo nuevo con su primer mensaje.
  async createThread(
    patientId: string,
    sender: Sender,
    data: { subject: string; category: MessageCategory; body: string },
  ) {
    const senderName = await this.name(sender.id);
    const thread = await this.prisma.messageThread.create({
      data: {
        patientId,
        subject: data.subject,
        category: data.category,
        messages: {
          create: {
            senderId: sender.id,
            senderRole: sender.role,
            senderName,
            body: data.body,
          },
        },
      },
      include: { messages: true },
    });
    await this.notifyNewMessage(thread.id, sender, senderName, data.body);
    return thread;
  }

  /// Bandeja del equipo: TODOS los hilos, con paciente y último mensaje.
  listAllThreads() {
    return this.prisma.messageThread.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { messages: true } },
      },
    });
  }

  /// Lista los hilos de un paciente con un resumen del último mensaje.
  async listThreads(patientId: string) {
    return this.prisma.messageThread.findMany({
      where: { patientId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
  }

  async getThread(threadId: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!thread) throw new NotFoundException('Conversación no encontrada.');
    return thread;
  }

  /// Agrega un mensaje a un hilo. `patientGuard` verifica que un paciente solo
  /// escriba en sus propios hilos.
  async addMessage(threadId: string, sender: Sender, body: string, patientGuard?: string) {
    const thread = await this.prisma.messageThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Conversación no encontrada.');
    if (patientGuard && thread.patientId !== patientGuard) {
      throw new ForbiddenException('No puedes escribir en esta conversación.');
    }
    const senderName = await this.name(sender.id);
    await this.prisma.message.create({
      data: {
        threadId,
        senderId: sender.id,
        senderRole: sender.role,
        senderName,
        body,
      },
    });
    await this.prisma.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    await this.notifyNewMessage(threadId, sender, senderName, body);
    return this.getThread(threadId);
  }
}
