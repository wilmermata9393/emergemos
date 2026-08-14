import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessageCategory, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface Sender {
  id: string;
  role: UserRole;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async name(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    return u ? `${u.firstName} ${u.lastName}` : 'Desconocido';
  }

  /// Crea un hilo nuevo con su primer mensaje.
  async createThread(
    patientId: string,
    sender: Sender,
    data: { subject: string; category: MessageCategory; body: string },
  ) {
    const senderName = await this.name(sender.id);
    return this.prisma.messageThread.create({
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
    return this.getThread(threadId);
  }
}
