import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { PushService } from './push.service';
import { AnnouncementsService } from './announcements.service';
import { NotificationsController, NotificationsAdminController } from './notifications.controller';
import { PushController } from './push.controller';
import { AnnouncementsController } from './announcements.controller';

// @Global para que otros módulos puedan disparar notificaciones (ej. mensajes).
@Global()
@Module({
  controllers: [NotificationsController, NotificationsAdminController, PushController, AnnouncementsController],
  providers: [NotificationsService, NotificationsScheduler, PushService, AnnouncementsService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
