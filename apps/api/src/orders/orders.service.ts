import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LabOrderStatus, MedicationOrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabOrderDto, CreateMedicationOrderDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async name(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    return u ? `${u.firstName} ${u.lastName}` : 'Desconocido';
  }
  async patientIdOf(userId: string): Promise<string> {
    const p = await this.prisma.patient.findUnique({ where: { userId }, select: { id: true } });
    if (!p) throw new NotFoundException('No hay registro de paciente para esta cuenta.');
    return p.id;
  }

  // ---- Catálogo de labs ----
  listLabTests() {
    return this.prisma.labTest.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  }
  listAllLabTests() {
    return this.prisma.labTest.findMany({ orderBy: [{ isActive: 'desc' }, { category: 'asc' }, { name: 'asc' }] });
  }
  createLabTest(data: { name: string; code?: string; category?: string }) {
    return this.prisma.labTest.create({ data: { name: data.name, code: data.code, category: data.category } });
  }
  async setLabTestActive(id: string, isActive: boolean) {
    const t = await this.prisma.labTest.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Prueba no encontrada.');
    return this.prisma.labTest.update({ where: { id }, data: { isActive } });
  }

  // ---- Órdenes de laboratorio ----
  async createLabOrder(patientId: string, dto: CreateLabOrderDto, orderedById: string) {
    const orderedByName = await this.name(orderedById);
    return this.prisma.labOrder.create({
      data: {
        patientId,
        orderedById,
        orderedByName,
        notes: dto.notes,
        items: { create: dto.items.map((i) => ({ name: i.name, code: i.code })) },
      },
      include: { items: true },
    });
  }

  listLabOrders(patientId: string) {
    return this.prisma.labOrder.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async setLabOrderStatus(id: string, status: LabOrderStatus) {
    const o = await this.prisma.labOrder.findUnique({ where: { id } });
    if (!o) throw new NotFoundException('Orden no encontrada.');
    return this.prisma.labOrder.update({ where: { id }, data: { status } });
  }

  // ---- Órdenes de medicamentos (recetas) ----
  async createMedicationOrder(patientId: string, dto: CreateMedicationOrderDto, prescriberId: string) {
    return this.prisma.medicationOrder.create({
      data: {
        patientId,
        prescriberId,
        drugName: dto.drugName,
        dose: dto.dose,
        route: dto.route,
        frequency: dto.frequency,
        durationDays: dto.durationDays,
        quantity: dto.quantity,
        refills: dto.refills ?? 0,
        instructions: dto.instructions,
      },
    });
  }

  /// Firma la receta re-verificando la credencial (contraseña) del prescriptor.
  /// Solo profesionales con NPI habilitados para recetar (canPrescribe).
  async signMedicationOrder(id: string, userId: string, password: string) {
    const order = await this.prisma.medicationOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Receta no encontrada.');
    if (order.status === MedicationOrderStatus.SIGNED) {
      throw new BadRequestException('La receta ya está firmada.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { providerProfile: true },
    });
    if (!user) throw new UnauthorizedException('Usuario inválido.');
    if (!user.providerProfile?.canPrescribe || !user.providerProfile?.npi) {
      throw new ForbiddenException('Solo un profesional con NPI habilitado puede firmar recetas.');
    }

    // Re-verificación de credencial: esto es lo que asegura que SOLO esta
    // persona (no alguien con su sesión abierta) firme el medicamento.
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta. No se firmó la receta.');

    return this.prisma.medicationOrder.update({
      where: { id },
      data: {
        status: MedicationOrderStatus.SIGNED,
        signedAt: new Date(),
        prescriberId: userId,
        prescriberName: `${user.firstName} ${user.lastName}`,
      },
    });
  }

  async cancelMedicationOrder(id: string) {
    const o = await this.prisma.medicationOrder.findUnique({ where: { id } });
    if (!o) throw new NotFoundException('Receta no encontrada.');
    return this.prisma.medicationOrder.update({ where: { id }, data: { status: MedicationOrderStatus.CANCELLED } });
  }

  listMedicationOrders(patientId: string) {
    return this.prisma.medicationOrder.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });
  }

  /// Para el portal: el paciente ve sus recetas firmadas y sus labs.
  listSignedMedicationOrders(patientId: string) {
    return this.prisma.medicationOrder.findMany({
      where: { patientId, status: MedicationOrderStatus.SIGNED },
      orderBy: { signedAt: 'desc' },
    });
  }
}
