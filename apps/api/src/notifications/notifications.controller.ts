import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Bandeja de notificaciones del usuario (cualquier rol autenticado).
@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.listForUser(user.id);
  }

  @Get('unread-count')
  unread(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Post(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markRead(id, user.id);
  }

  @Post('read-all')
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.id);
  }
}

// Disparo manual de los trabajos (para pruebas / operación). Solo admin.
@Controller('notifications')
export class NotificationsAdminController {
  constructor(private readonly scheduler: NotificationsScheduler) {}

  @Roles(UserRole.ADMIN)
  @Post('run-jobs')
  run() {
    return this.scheduler.runAll();
  }
}
