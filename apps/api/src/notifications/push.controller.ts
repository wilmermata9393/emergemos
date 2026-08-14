import { Body, Controller, Get, Post } from '@nestjs/common';
import { PushService } from './push.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Controller()
export class PushController {
  constructor(private readonly push: PushService) {}

  /// Llave pública VAPID (la necesita el navegador para suscribirse). Pública.
  @Public()
  @Get('push/vapid-public-key')
  vapidKey() {
    return { key: this.push.publicKey };
  }

  /// Guarda la suscripción push de este dispositivo (usuario autenticado).
  @Post('me/push/subscribe')
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() sub: any) {
    return this.push.saveSubscription(user.id, sub);
  }

  @Post('me/push/unsubscribe')
  unsubscribe(@Body('endpoint') endpoint: string) {
    return this.push.removeSubscription(endpoint);
  }
}
