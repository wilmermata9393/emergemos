import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Roles } from '../common/decorators/roles.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

@Controller('lab-tests')
export class LabTestsController {
  constructor(private readonly orders: OrdersService) {}

  /// Catálogo activo para el checklist (equipo clínico).
  @Roles(...CLINICAL)
  @Get()
  list() {
    return this.orders.listLabTests();
  }

  /// Todos los labs (incluye inactivos) — administración.
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER)
  @Get('all')
  all() {
    return this.orders.listAllLabTests();
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER)
  @Post()
  create(@Body() body: { name: string; code?: string; category?: string }) {
    return this.orders.createLabTest(body);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER)
  @Post(':id/active')
  setActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.orders.setLabTestActive(id, active);
  }
}
