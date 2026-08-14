import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

// @Global para que el interceptor y otros módulos usen AuditService fácilmente.
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
