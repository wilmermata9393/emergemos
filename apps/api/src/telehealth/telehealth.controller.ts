import { Controller, Get, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TelehealthService } from './telehealth.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller('telehealth')
export class TelehealthController {
  constructor(private readonly telehealth: TelehealthService) {}

  /// Info de la sala de una cita + si el usuario puede entrar.
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT, UserRole.PATIENT)
  @Get('appointments/:id/room')
  room(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.telehealth.roomInfo(id, { id: user.id, role: user.role as UserRole });
  }
}
