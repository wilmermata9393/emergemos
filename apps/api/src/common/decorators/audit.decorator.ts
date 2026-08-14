import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

/// Marca una ruta para que el AuditInterceptor registre el acceso.
/// Ej: @Audit(AuditAction.VIEW, 'Patient')
export const AUDIT_KEY = 'audit';

export interface AuditMeta {
  action: AuditAction;
  entityType: string;
}

export const Audit = (action: AuditAction, entityType: string) =>
  SetMetadata(AUDIT_KEY, { action, entityType } as AuditMeta);
