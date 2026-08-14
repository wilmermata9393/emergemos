import { Body, Controller, Get, Param, Post, BadRequestException } from '@nestjs/common';
import { AuditAction, LabOrderStatus, UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateLabOrderDto, CreateMedicationOrderDto, SignMedicationDto } from './dto/orders.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const CLINICAL = [UserRole.ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.STUDENT];

// Gestión de órdenes por el equipo.
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // ---- Laboratorios ----
  @Roles(UserRole.ADMIN, UserRole.PROVIDER, UserRole.STUDENT)
  @Audit(AuditAction.CREATE, 'LabOrder')
  @Post('patients/:patientId/lab-orders')
  createLab(@Param('patientId') patientId: string, @Body() dto: CreateLabOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.orders.createLabOrder(patientId, dto, user.id);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'LabOrder')
  @Get('patients/:patientId/lab-orders')
  listLab(@Param('patientId') patientId: string) {
    return this.orders.listLabOrders(patientId);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.UPDATE, 'LabOrder')
  @Post('lab-orders/:id/status')
  setLabStatus(@Param('id') id: string, @Body('status') status: string) {
    if (!Object.values(LabOrderStatus).includes(status as LabOrderStatus)) {
      throw new BadRequestException('Estado inválido.');
    }
    return this.orders.setLabOrderStatus(id, status as LabOrderStatus);
  }

  // ---- Medicamentos (recetas) ----
  @Roles(UserRole.PROVIDER)
  @Audit(AuditAction.CREATE, 'MedicationOrder')
  @Post('patients/:patientId/medication-orders')
  createMed(@Param('patientId') patientId: string, @Body() dto: CreateMedicationOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.orders.createMedicationOrder(patientId, dto, user.id);
  }

  @Roles(...CLINICAL)
  @Audit(AuditAction.VIEW, 'MedicationOrder')
  @Get('patients/:patientId/medication-orders')
  listMed(@Param('patientId') patientId: string) {
    return this.orders.listMedicationOrders(patientId);
  }

  /// Firmar la receta con la credencial (contraseña). Solo PROVIDER con NPI.
  @Roles(UserRole.PROVIDER)
  @Audit(AuditAction.SIGN, 'MedicationOrder')
  @Post('medication-orders/:id/sign')
  signMed(@Param('id') id: string, @Body() dto: SignMedicationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.orders.signMedicationOrder(id, user.id, dto.password);
  }

  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  @Audit(AuditAction.UPDATE, 'MedicationOrder')
  @Post('medication-orders/:id/cancel')
  cancelMed(@Param('id') id: string) {
    return this.orders.cancelMedicationOrder(id);
  }
}
