import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SchedulingService } from './scheduling.service';
import { BookAppointmentDto } from './dto/scheduling.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Citas del paciente (portal). Cada quien gestiona solo las suyas.
@Roles(UserRole.PATIENT)
@Controller('me/appointments')
export class PatientAppointmentsController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const patientId = await this.scheduling.patientIdOf(user.id);
    return this.scheduling.listForPatient(patientId);
  }

  /// El paciente agenda su propia cita (queda como "solicitada").
  @Post()
  async book(@CurrentUser() user: AuthenticatedUser, @Body() dto: BookAppointmentDto) {
    const patientId = await this.scheduling.patientIdOf(user.id);
    return this.scheduling.book(dto, patientId, user.id, false);
  }

  @Post(':id/confirm')
  async confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const patientId = await this.scheduling.patientIdOf(user.id);
    return this.scheduling.patientConfirm(id, patientId);
  }

  @Post(':id/request-reschedule')
  async requestReschedule(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const patientId = await this.scheduling.patientIdOf(user.id);
    return this.scheduling.patientRequestReschedule(id, patientId);
  }

  @Post(':id/cancel')
  async cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const patientId = await this.scheduling.patientIdOf(user.id);
    return this.scheduling.patientCancel(id, patientId);
  }
}
