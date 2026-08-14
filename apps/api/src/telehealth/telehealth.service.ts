import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelehealthService {
  constructor(private readonly prisma: PrismaService) {}

  /// La sala de una cita. Se deriva del id de la cita.
  roomForAppointment(appointmentId: string) {
    return `appt-${appointmentId}`;
  }

  /// ¿Puede este usuario entrar a la sala?
  ///  - Salas de cita ("appt-<id>"): el profesional de la cita, su paciente, o
  ///    cualquier miembro del equipo clínico (supervisión).
  ///  - Otras salas (clases/grupales "room-*"): usuarios autenticados (demo).
  async canJoin(user: { id: string; role: UserRole }, roomId: string): Promise<boolean> {
    if (roomId.startsWith('appt-')) {
      const appt = await this.prisma.appointment.findUnique({
        where: { id: roomId.slice(5) },
        include: { patient: { select: { userId: true } } },
      });
      if (!appt) return false;
      if (user.id === appt.providerId) return true;
      if (user.id === appt.patient.userId) return true;
      // Personal clínico puede unirse (p. ej. supervisión / clase grupal).
      const clinical: UserRole[] = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];
      return clinical.includes(user.role);
    }
    // Salas genéricas (clases): cualquier usuario autenticado (demo).
    return true;
  }

  /// Información de la sala de una cita, con permiso de entrada.
  async roomInfo(appointmentId: string, user: { id: string; role: UserRole }) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: { select: { name: true } },
        provider: { select: { firstName: true, lastName: true } },
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!appt) throw new NotFoundException('Cita no encontrada.');
    const roomId = this.roomForAppointment(appointmentId);
    return {
      roomId,
      canJoin: await this.canJoin(user, roomId),
      appointment: {
        id: appt.id,
        startAt: appt.startAt,
        type: appt.type,
        service: appt.service?.name,
        provider: `${appt.provider.firstName} ${appt.provider.lastName}`,
        patient: `${appt.patient.user.firstName} ${appt.patient.user.lastName}`,
      },
    };
  }
}
