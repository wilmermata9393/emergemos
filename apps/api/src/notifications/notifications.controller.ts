import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NotificationType, UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { BroadcastDto } from './dto/broadcast.dto';
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

  /// Marca leídos los avisos de mensajes (se llama al entrar a la bandeja de mensajes).
  @Post('read-messages')
  readMessages(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markMessagesRead(user.id);
  }
}

// Disparo manual de trabajos + difusión de anuncios. Admin (y profesional para anuncios).
@Controller('notifications')
export class NotificationsAdminController {
  constructor(
    private readonly scheduler: NotificationsScheduler,
    private readonly notifications: NotificationsService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Post('run-jobs')
  run() {
    return this.scheduler.runAll();
  }

  /// Crea una notificación de prueba para el propio usuario (diagnóstico).
  @Roles(UserRole.ADMIN, UserRole.PROVIDER, UserRole.STAFF)
  @Post('test')
  test(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.notify({
      userId: user.id,
      type: NotificationType.GENERAL,
      title: '🔔 Notificación de prueba',
      body: 'Si ves esto (y sonó el timbre), las notificaciones funcionan correctamente.',
      dedupeKey: `test-${user.id}-${Date.now()}`,
    });
  }

  /// Difunde un anuncio/promoción (admin o profesional).
  @Roles(UserRole.ADMIN, UserRole.PROVIDER)
  @Post('broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.notifications.broadcast(dto);
  }
}
