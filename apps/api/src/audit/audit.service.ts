import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  patientId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/// Escribe en el registro de auditoría. Esta tabla es de solo-inserción:
/// nunca se actualiza ni se borra (integridad del rastro de auditoría HIPAA).
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          patientId: entry.patientId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: entry.metadata,
        },
      });
    } catch (err) {
      // Nunca dejamos que un fallo de auditoría rompa la operación del usuario,
      // pero SÍ lo registramos como error grave para revisarlo.
      this.logger.error(`No se pudo escribir en auditoría: ${String(err)}`);
    }
  }
}
