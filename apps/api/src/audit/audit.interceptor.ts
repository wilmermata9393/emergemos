import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditMeta } from '../common/decorators/audit.decorator';
import { AuditService } from './audit.service';

/// Después de que una ruta marcada con @Audit(...) responde con éxito,
/// registra automáticamente quién accedió, a qué paciente y desde dónde.
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, context.getHandler());

    // Si la ruta no está marcada para auditar, seguir sin registrar.
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    // El paciente solo viene del parámetro :patientId. El :id es la entidad
    // afectada (paciente, nota, etc.) según la ruta.
    const patientId = req.params?.patientId ?? (meta.entityType === 'Patient' ? req.params?.id : null) ?? null;
    const entityId = req.params?.id ?? req.params?.patientId ?? null;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.record({
          actorId: user?.id ?? null,
          action: meta.action,
          entityType: meta.entityType,
          entityId,
          patientId,
          ipAddress: req.ip ?? null,
          userAgent: req.headers?.['user-agent'] ?? null,
          metadata: { method: req.method, path: req.originalUrl },
        });
      }),
    );
  }
}
