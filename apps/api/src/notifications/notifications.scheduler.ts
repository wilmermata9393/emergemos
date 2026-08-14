import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus, NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

// Límites del día (00:00 a 23:59:59.999) para una fecha dada.
function dayBounds(date: Date) {
  const start = new Date(date); start.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setHours(23, 59, 59, 999);
  return { start, end };
}
const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const hhmm = (d: Date) => d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Cada hora: recordatorios de citas a 3 días y 1 día (el dedupe evita repetir).
  @Cron(CronExpression.EVERY_HOUR)
  hourly() {
    return this.generateAppointmentReminders();
  }

  // Cada día a las 7am: agenda del día para cada profesional + cumpleaños.
  @Cron('0 7 * * *')
  daily() {
    return this.runDaily();
  }

  /// Ejecuta todos los trabajos de una vez (para pruebas manuales).
  async runAll() {
    const reminders = await this.generateAppointmentReminders();
    const providerAgenda = await this.generateProviderDailyAgenda();
    const birthdays = await this.generateBirthdays();
    return { reminders, providerAgenda, birthdays };
  }

  private async runDaily() {
    const providerAgenda = await this.generateProviderDailyAgenda();
    const birthdays = await this.generateBirthdays();
    return { providerAgenda, birthdays };
  }

  /// (B) Recordatorios al PACIENTE: dos avisos, 3 días antes y 1 día antes.
  async generateAppointmentReminders(): Promise<number> {
    const now = new Date();
    let created = 0;
    for (const days of [3, 1]) {
      const target = new Date(now);
      target.setDate(target.getDate() + days);
      const { start, end } = dayBounds(target);
      const appts = await this.prisma.appointment.findMany({
        where: {
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.REQUESTED] },
          startAt: { gte: start, lte: end },
        },
        include: { patient: { select: { userId: true } }, service: { select: { name: true } } },
      });
      for (const a of appts) {
        const when = a.startAt.toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
        const label = days === 1 ? 'mañana' : `en ${days} días`;
        const res = await this.notifications.notify({
          userId: a.patient.userId,
          type: NotificationType.APPOINTMENT_REMINDER,
          title: `Recordatorio: tu cita es ${label}`,
          body: `Tienes una cita (${a.service?.name ?? 'consulta'}) el ${when}.`,
          relatedId: a.id,
          dedupeKey: `reminder-${days}d-${a.id}`,
        });
        if (res && (res as any).createdAt) created++;
      }
    }
    this.logger.log(`Recordatorios de cita (3d/1d) procesados.`);
    return created;
  }

  /// (A) Agenda del día para cada profesional: lista de sus citas de hoy con
  /// nombre del paciente y servicio (ej. "09:00 Juan Pérez — Quiropráctica").
  async generateProviderDailyAgenda(): Promise<number> {
    const now = new Date();
    const { start, end } = dayBounds(now);
    const dateKey = ymd(now);

    const providers = await this.prisma.user.findMany({
      where: { role: UserRole.PROVIDER, isActive: true },
      select: { id: true },
    });

    let created = 0;
    for (const prov of providers) {
      const appts = await this.prisma.appointment.findMany({
        where: {
          providerId: prov.id,
          status: { not: AppointmentStatus.CANCELLED },
          startAt: { gte: start, lte: end },
        },
        orderBy: { startAt: 'asc' },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          service: { select: { name: true } },
        },
      });
      if (appts.length === 0) continue;

      const lines = appts
        .map((a) => `• ${hhmm(a.startAt)}  ${a.patient.user.firstName} ${a.patient.user.lastName} — ${a.service?.name ?? 'Consulta'}`)
        .join('\n');
      const res = await this.notifications.notify({
        userId: prov.id,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: `Tus citas de hoy (${appts.length})`,
        body: `Agenda del día:\n${lines}`,
        dedupeKey: `agenda-${prov.id}-${dateKey}`,
      });
      if (res && (res as any).createdAt) created++;
    }
    this.logger.log(`Agenda diaria enviada a profesionales con citas.`);
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
