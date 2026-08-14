import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppointmentStatus, AuditAction, UserRole } from '@prisma/client';
import { SchedulingService } from './scheduling.service';
import { BookAppointmentDto, RescheduleDto } from './dto/scheduling.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

// Gestión de citas por parte del equipo.
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly scheduling: SchedulingService) {}

  /// El equipo agenda una cita para un paciente (queda confirmada).
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER)
  @Audit(AuditAction.CREATE, 'Appointment')
  @Post()
  book(@Body() dto: BookAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    if (!dto.patientId) throw new Error('Falta el paciente.');
    return this.scheduling.book(dto, dto.patientId, user.id, true);
  }

  @Roles(...CLINICAL)
  @Get()
  listByProvider(@Query('providerId') providerId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.scheduling.listForProvider(providerId, from, to);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.UPDATE, 'Appointment')
  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.scheduling.setStatus(id, AppointmentStatus.CONFIRMED);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.UPDATE, 'Appointment')
  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.scheduling.setStatus(id, AppointmentStatus.CANCELLED);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.UPDATE, 'Appointment')
  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.scheduling.setStatus(id, AppointmentStatus.COMPLETED);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.UPDATE, 'Appointment')
  @Post(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto) {
    return this.scheduling.reschedule(id, dto.startAt);
  }
}
