import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Planes médicos aceptados ----
  listActivePlans() {
    return this.prisma.insurancePlan.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }
  listAllPlans() {
    return this.prisma.insurancePlan.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  }
  createPlan(name: string) {
    return this.prisma.insurancePlan.create({ data: { name } });
  }
  async updatePlan(id: string, name: string) {
    const p = await this.prisma.insurancePlan.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Plan no encontrado.');
    return this.prisma.insurancePlan.update({ where: { id }, data: { name } });
  }
  async setPlanActive(id: string, isActive: boolean) {
    const p = await this.prisma.insurancePlan.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Plan no encontrado.');
    return this.prisma.insurancePlan.update({ where: { id }, data: { isActive } });
  }
}
