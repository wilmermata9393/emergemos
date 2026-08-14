import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentStatus, AppointmentType, Prisma, TimeOffType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceDto,
  SetAvailabilityDto,
  CreateTimeOffDto,
  BookAppointmentDto,
} from './dto/scheduling.dto';

const SLOT_STEP_MIN = 15; // rejilla de horarios cada 15 minutos
const DEFAULT_DURATION = 30;

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async patientIdOf(userId: string): Promise<string> {
    const p = await this.prisma.patient.findUnique({ where: { userId }, select: { id: true } });
    if (!p) throw new NotFoundException('No hay registro de paciente para esta cuenta.');
    return p.id;
  }

  // ---- Servicios ----
  listServices() {
    return this.prisma.service.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }
  /// Todos los servicios (incluye inactivos) — para administración.
  listAllServices() {
    return this.prisma.service.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  }
  createService(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }
  async updateService(id: string, dto: Partial<CreateServiceDto>) {
    const s = await this.prisma.service.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Servicio no encontrado.');
    return this.prisma.service.update({ where: { id }, data: dto });
  }
  async setServiceActive(id: string, isActive: boolean) {
    const s = await this.prisma.service.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Servicio no encontrado.');
    return this.prisma.service.update({ where: { id }, data: { isActive } });
  }

  // ---- Profesionales (para el booking) ----
  listProviders() {
    return this.prisma.user.findMany({
      where: { role: UserRole.PROVIDER, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        providerProfile: { select: { discipline: true, displayTitle: true, bio: true } },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  // ---- Disponibilidad ----
  getAvailability(providerId: string) {
    return this.prisma.providerAvailability.findMany({
      where: { providerId },
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  /// Reemplaza toda la disponibilidad del profesional por el conjunto enviado.
  async setAvailability(providerId: string, dto: SetAvailabilityDto) {
    for (const s of dto.slots) {
      if (s.endMinute <= s.startMinute) {
        throw new BadRequestException('La hora de fin debe ser mayor que la de inicio.');
      }
    }
    await this.prisma.$transaction([
      this.prisma.providerAvailability.deleteMany({ where: { providerId } }),
      this.prisma.providerAvailability.createMany({
        data: dto.slots.map((s) => ({ providerId, dayOfWeek: s.dayOfWeek, startMinute: s.startMinute, endMinute: s.endMinute })),
      }),
    ]);
    return this.getAvailability(providerId);
  }

  // ---- Bloqueos (time off) ----
  listTimeOff(providerId: string) {
    return this.prisma.timeOff.findMany({ where: { providerId }, orderBy: { startAt: 'desc' } });
  }
  createTimeOff(providerId: string, dto: CreateTimeOffDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) throw new BadRequestException('El fin debe ser posterior al inicio.');
    return this.prisma.timeOff.create({
      data: { providerId, type: dto.type as TimeOffType, startAt, endAt, note: dto.note },
    });
  }
  async deleteTimeOff(providerId: string, id: string) {
    const t = await this.prisma.timeOff.findUnique({ where: { id } });
    if (!t || t.providerId !== providerId) throw new NotFoundException('Bloqueo no encontrado.');
    await this.prisma.timeOff.delete({ where: { id } });
    return { ok: true };
  }

  // ---- Cálculo de horarios libres ----
  async slots(providerId: string, serviceId: string | undefined, dateStr: string) {
    const duration = serviceId
      ? (await this.prisma.service.findUnique({ where: { id: serviceId } }))?.durationMin ?? DEFAULT_DURATION
      : DEFAULT_DURATION;

    const dayStart = new Date(`${dateStr}T00:00:00`);
    if (isNaN(dayStart.getTime())) throw new BadRequestException('Fecha inválida.');
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dow = dayStart.getDay();

    const avails = await this.prisma.providerAvailability.findMany({
      where: { providerId, dayOfWeek: dow },
    });
    if (avails.length === 0) return { date: dateStr, durationMin: duration, slots: [] as string[] };

    const [appts, timeoffs] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { providerId, startAt: { gte: dayStart, lt: dayEnd }, status: { not: AppointmentStatus.CANCELLED } },
        select: { startAt: true, endAt: true },
      }),
      this.prisma.timeOff.findMany({
        where: { providerId, startAt: { lt: dayEnd }, endAt: { gt: dayStart } },
        select: { startAt: true, endAt: true },
      }),
    ]);
    const busy = [...appts, ...timeoffs].map((b) => [b.startAt.getTime(), b.endAt.getTime()] as const);

    const now = Date.now();
    const slots: string[] = [];
    for (const a of avails) {
      for (let t = a.startMinute; t + duration <= a.endMinute; t += SLOT_STEP_MIN) {
        const start = new Date(dayStart.getTime() + t * 60000);
        const end = new Date(start.getTime() + duration * 60000);
        if (start.getTime() < now) continue; // no ofrecer horarios pasados
        const overlaps = busy.some(([bs, be]) => start.getTime() < be && end.getTime() > bs);
        if (!overlaps) slots.push(start.toISOString());
      }
    }
    return { date: dateStr, durationMin: duration, slots };
  }

  // ---- Citas ----
  private async assertFree(providerId: string, startAt: Date, endAt: Date, ignoreId?: string) {
    const clash = await this.prisma.appointment.findFirst({
      where: {
        providerId,
        status: { not: AppointmentStatus.CANCELLED },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
      },
    });
    if (clash) throw new BadRequestException('Ese horario ya no está disponible.');
  }

  async book(dto: BookAppointmentDto, patientId: string, createdById: string, bookedByStaff: boolean) {
    const startAt = new Date(dto.startAt);
    if (isNaN(startAt.getTime())) throw new BadRequestException('Fecha/hora inválida.');
    const duration = dto.serviceId
      ? (await this.prisma.service.findUnique({ where: { id: dto.serviceId } }))?.durationMin ?? DEFAULT_DURATION
      : DEFAULT_DURATION;
    const endAt = new Date(startAt.getTime() + duration * 60000);

    await this.assertFree(dto.providerId, startAt, endAt);

    return this.prisma.appointment.create({
      data: {
        providerId: dto.providerId,
        patientId,
        serviceId: dto.serviceId,
        startAt,
        endAt,
        type: dto.type ?? AppointmentType.IN_PERSON,
        reason: dto.reason,
        createdById,
        // Si lo agenda el equipo, queda confirmada; si el paciente, queda solicitada.
        status: bookedByStaff ? AppointmentStatus.CONFIRMED : AppointmentStatus.REQUESTED,
      },
      include: { service: true, provider: { select: { firstName: true, lastName: true } } },
    });
  }

  listForProvider(providerId: string, from: string, to: string) {
    return this.prisma.appointment.findMany({
      where: { providerId, startAt: { gte: new Date(from), lte: new Date(to) } },
      orderBy: { startAt: 'asc' },
      include: {
        service: { select: { name: true } },
        patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
    });
  }

  listForPatient(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      orderBy: { startAt: 'asc' },
      include: {
        service: { select: { name: true } },
        provider: { select: { firstName: true, lastName: true } },
      },
    });
  }

  private async getOwnedByPatient(id: string, patientId: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt || appt.patientId !== patientId) throw new NotFoundException('Cita no encontrada.');
    return appt;
  }

  /// El paciente confirma su asistencia.
  async patientConfirm(id: string, patientId: string) {
    await this.getOwnedByPatient(id, patientId);
    return this.prisma.appointment.update({ where: { id }, data: { status: AppointmentStatus.CONFIRMED } });
  }

  /// El paciente solicita reagendar.
  async patientRequestReschedule(id: string, patientId: string) {
    await this.getOwnedByPatient(id, patientId);
    return this.prisma.appointment.update({ where: { id }, data: { status: AppointmentStatus.RESCHEDULE_REQUESTED } });
  }

  async patientCancel(id: string, patientId: string) {
    await this.getOwnedByPatient(id, patientId);
    return this.prisma.appointment.update({ where: { id }, data: { status: AppointmentStatus.CANCELLED } });
  }

  // Acciones del equipo
  async setStatus(id: string, status: AppointmentStatus) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Cita no encontrada.');
    return this.prisma.appointment.update({ where: { id }, data: { status } });
  }

  async reschedule(id: string, startAtStr: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { service: true } });
    if (!appt) throw new NotFoundException('Cita no encontrada.');
    const startAt = new Date(startAtStr);
    const duration = appt.service?.durationMin ?? Math.round((appt.endAt.getTime() - appt.startAt.getTime()) / 60000);
    const endAt = new Date(startAt.getTime() + duration * 60000);
    await this.assertFree(appt.providerId, startAt, endAt, id);
    return this.prisma.appointment.update({
      where: { id },
      data: { startAt, endAt, status: AppointmentStatus.CONFIRMED },
    });
  }
}
