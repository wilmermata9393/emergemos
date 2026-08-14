import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SchedulingService } from './scheduling.service';
import { SetAvailabilityDto, CreateTimeOffDto } from './dto/scheduling.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Agenda propia del profesional (self-service).
@Roles(UserRole.PROVIDER)
@Controller('me')
export class ScheduleController {
  constructor(private readonly scheduling: SchedulingService) {}

  @Get('availability')
  getAvailability(@CurrentUser() user: AuthenticatedUser) {
    return this.scheduling.getAvailability(user.id);
  }

  @Put('availability')
  setAvailability(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetAvailabilityDto) {
    return this.scheduling.setAvailability(user.id, dto);
  }

  @Get('time-off')
  listTimeOff(@CurrentUser() user: AuthenticatedUser) {
    return this.scheduling.listTimeOff(user.id);
  }

  @Post('time-off')
  createTimeOff(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTimeOffDto) {
    return this.scheduling.createTimeOff(user.id, dto);
  }

  @Delete('time-off/:id')
  deleteTimeOff(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.scheduling.deleteTimeOff(user.id, id);
  }

  /// Mi agenda de citas entre dos fechas (?from=&to= en ISO).
  @Get('agenda')
  agenda(@CurrentUser() user: AuthenticatedUser, @Query('from') from: string, @Query('to') to: string) {
    return this.scheduling.listForProvider(user.id, from, to);
  }
}
