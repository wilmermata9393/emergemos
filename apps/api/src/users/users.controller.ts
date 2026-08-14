import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuditAction, UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateOwnProfileDto } from './dto/users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Gestión del equipo. Solo administradores.
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query('q') q?: string, @Query('role') role?: UserRole) {
    return this.users.list(q, role);
  }

  @Audit(AuditAction.CREATE, 'User')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Audit(AuditAction.UPDATE, 'User')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Audit(AuditAction.UPDATE, 'User')
  @Post(':id/active')
  setActive(@Param('id') id: string, @Body('active') active: boolean, @CurrentUser() user: AuthenticatedUser) {
    return this.users.setActive(id, active, user.id);
  }
}

// Perfil propio del profesional/equipo (cada quien edita el suyo).
@Roles(UserRole.PROVIDER, UserRole.STUDENT, UserRole.STAFF, UserRole.ADMIN)
@Controller('me/staff-profile')
export class StaffProfileController {
  constructor(private readonly users: UsersService) {}

  @Get()
  myProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.users.myProfile(user.id);
  }

  @Audit(AuditAction.UPDATE, 'User')
  @Patch()
  updateOwn(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateOwnProfileDto) {
    return this.users.updateOwn(user.id, dto);
  }
}
