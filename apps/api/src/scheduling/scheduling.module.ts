import { Module } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { ServicesController } from './services.controller';
import { ProvidersController } from './providers.controller';
import { ScheduleController } from './schedule.controller';
import { AppointmentsController } from './appointments.controller';
import { PatientAppointmentsController } from './patient-appointments.controller';

@Module({
  controllers: [
    ServicesController,
    ProvidersController,
    ScheduleController,
    AppointmentsController,
    PatientAppointmentsController,
  ],
  providers: [SchedulingService],
})
export class SchedulingModule {}
