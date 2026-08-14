import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsController, NotificationsAdminController } from './notifications.controller';

// @Global para que otros módulos puedan disparar notificaciones (ej. mensajes).
@Global()
@Module({
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
