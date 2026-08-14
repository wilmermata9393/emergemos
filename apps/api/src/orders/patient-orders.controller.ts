import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// El paciente ve sus recetas (firmadas) y sus órdenes de laboratorio.
@Roles(UserRole.PATIENT)
@Controller('me')
export class PatientOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('medication-orders')
  async meds(@CurrentUser() user: AuthenticatedUser) {
    const patientId = await this.orders.patientIdOf(user.id);
    return this.orders.listSignedMedicationOrders(patientId);
  }

  @Get('lab-orders')
  async labs(@CurrentUser() user: AuthenticatedUser) {
    const patientId = await this.orders.patientIdOf(user.id);
    return this.orders.listLabOrders(patientId);
  }
}
