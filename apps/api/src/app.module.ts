import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { PatientsModule } from './patients/patients.module';
import { ClinicalModule } from './clinical/clinical.module';
import { VitalsModule } from './vitals/vitals.module';
import { NotesModule } from './notes/notes.module';
import { StorageModule } from './storage/storage.module';
import { FilesModule } from './files/files.module';
import { MessagesModule } from './messages/messages.module';
import { PortalModule } from './portal/portal.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { OrdersModule } from './orders/orders.module';
import { TelehealthModule } from './telehealth/telehealth.module';
import { ConsentsModule } from './consents/consents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { CatalogModule } from './catalog/catalog.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './audit/audit.interceptor';

@Module({
  imports: [
    // Las variables ya se cargaron en main.ts (dotenv). Aquí solo las exponemos
    // de forma global a través de ConfigService, sin volver a leer el archivo.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    ScheduleModule.forRoot(),
    // Límite general de peticiones (anti-abuso). El login tiene un límite más
    // estricto con @Throttle en su controlador.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    AuditModule,
    ClinicalModule,
    StorageModule,
    FilesModule,
    MessagesModule,
    PatientsModule,
    VitalsModule,
    NotesModule,
    PortalModule,
    SchedulingModule,
    OrdersModule,
    TelehealthModule,
    ConsentsModule,
    NotificationsModule,
    UsersModule,
    CatalogModule,
  ],
  providers: [
    // 0) Límite de peticiones por IP (anti-abuso / fuerza bruta).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // 1) Toda ruta exige sesión válida por defecto (salvo las marcadas @Public).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 2) Luego se verifica el rol requerido para la ruta.
    { provide: APP_GUARD, useClass: RolesGuard },
    // 3) El interceptor de auditoría registra cada acceso a datos de pacientes.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
