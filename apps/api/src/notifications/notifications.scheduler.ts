import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Cada hora: recordatorios de citas próximas.
  @Cron(CronExpression.EVERY_HOUR)
  hourly() {
    return this.generateAppointmentReminders();
  }

  // Cada día a las 8am: cumpleaños.
  @Cron('0 8 * * *')
  daily() {
    return this.generateBirthdays();
  }

  /// Ejecuta todos los trabajos de una vez (para pruebas manuales).
  async runAll() {
    const reminders = await this.generateAppointmentReminders();
    const birthdays = await this.generateBirthdays();
    return { reminders, birthdays };
  }

  /// Recordatorios de citas CONFIRMADAS en las próximas 24 horas.
  async generateAppointmentReminders(): Promise<number> {
    const now = new Date();
    const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const appts = await this.prisma.appointment.findMany({
      where: { status: AppointmentStatus.CONFIRMED, startAt: { gte: now, lte: in24 } },
      include: { patient: { select: { userId: true } }, service: { select: { name: true } } },
    });
    let created = 0;
    for (const a of appts) {
      const when = a.startAt.toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      const res = await this.notifications.notify({
        userId: a.patient.userId,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Recordatorio de cita',
        body: `Tienes una cita (${a.service?.name ?? 'consulta'}) el ${when}.`,
        relatedId: a.id,
        dedupeKey: `reminder-${a.id}`,
      });
      if (res && (res as any).createdAt) created++;
    }
    this.logger.log(`Recordatorios de cita procesados: ${appts.length}`);
    return created;
  }

  /// Cumpleaños: avisa al paciente y al equipo.
  async generateBirthdays(): Promise<number> {
    const today = new Date();
    const m = today.getMonth();
    const d = today.getDate();
    const year = today.getFullYear();

    const patients = await this.prisma.patient.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    const birthdayPatients = patients.filter((p) => {
      // La fecha de nacimiento se guarda como fecha-calendario (medianoche UTC),
      // por eso comparamos con componentes UTC para no correr un día.
      const dob = new Date(p.dateOfBirth);
      return dob.getUTCMonth() === m && dob.getUTCDate() === d;
    });
    if (birthdayPatients.length === 0) return 0;

    const staff = await this.prisma.user.findMany({
      where: { isActive: true, role: { in: [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER] } },
      select: { id: true },
    });

    let created = 0;
    for (const p of birthdayPatients) {
      // Al paciente
      await this.notifications.notify({
        userId: p.user.id,
        type: NotificationType.BIRTHDAY,
        title: '¡Feliz cumpleaños! 🎉',
        body: `Te deseamos un feliz cumpleaños, ${p.user.firstName}. Tu equipo de salud.`,
        dedupeKey: `bday-${p.user.id}-${year}`,
      });
      created++;
      // Al equipo
      for (const s of staff) {
        await this.notifications.notify({
          userId: s.id,
          type: NotificationType.BIRTHDAY,
          title: 'Cumpleaños de paciente',
          body: `Hoy cumple años ${p.user.firstName} ${p.user.lastName}.`,
          relatedId: p.id,
          dedupeKey: `bday-staff-${p.user.id}-${s.id}-${year}`,
        });
      }
    }
    this.logger.log(`Cumpleaños hoy: ${birthdayPatients.length}`);
    return created;
  }
}
