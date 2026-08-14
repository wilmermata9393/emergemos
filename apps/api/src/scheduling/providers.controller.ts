import { Controller, Get, Param, Query } from '@nestjs/common';
import { SchedulingService } from './scheduling.service';

// Información para el Online Booking (visible para pacientes autenticados).
@Controller('providers')
export class ProvidersController {
  constructor(private readonly scheduling: SchedulingService) {}

  /// Lista de profesionales con su biografía/disciplina.
  @Get()
  list() {
    return this.scheduling.listProviders();
  }

  @Get(':id/availability')
  availability(@Param('id') id: string) {
    return this.scheduling.getAvailability(id);
  }

  /// Horarios libres de un profesional en una fecha (YYYY-MM-DD).
  @Get(':id/slots')
  slots(
    @Param('id') id: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.scheduling.slots(id, serviceId, date);
  }
}
