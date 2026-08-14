import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('lab-tests')
export class LabTestsController {
  constructor(private readonly orders: OrdersService) {}

  /// Catálogo de pruebas para el checklist (equipo clínico).
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT)
  @Get()
  list() {
    return this.orders.listLabTests();
  }
}
