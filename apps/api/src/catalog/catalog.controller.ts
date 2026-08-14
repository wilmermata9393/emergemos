import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CatalogService } from './catalog.service';
import { Roles } from '../common/decorators/roles.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

@Controller('insurance-plans')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  /// Planes activos — para el select del plan médico (equipo clínico).
  @Roles(...CLINICAL)
  @Get()
  list() {
    return this.catalog.listActivePlans();
  }

  /// Todos los planes (incluye inactivos) — administración.
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('all')
  all() {
    return this.catalog.listAllPlans();
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post()
  create(@Body('name') name: string) {
    return this.catalog.createPlan(name);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch(':id')
  update(@Param('id') id: string, @Body('name') name: string) {
    return this.catalog.updatePlan(id, name);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post(':id/active')
  setActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.catalog.setPlanActive(id, active);
  }
}
