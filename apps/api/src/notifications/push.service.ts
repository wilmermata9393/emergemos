import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/// Envía notificaciones Web Push (llegan aunque el navegador esté cerrado).
/// Requiere las variables VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY. Si faltan,
/// el servicio queda deshabilitado y no rompe nada (los avisos in-app siguen).
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(private readonly prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (pub && priv) {
      try {
        webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:soporte@emergemos.app', pub, priv);
        this.enabled = true;
        this.logger.log('Web Push habilitado.');
      } catch (e: any) {
        this.logger.warn(`No se pudo iniciar Web Push: ${e.message}`);
      }
    } else {
      this.logger.log('Web Push deshabilitado (faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).');
    }
  }

  get publicKey(): string {
    return process.env.VAPID_PUBLIC_KEY || '';
  }

  /// Guarda (o actualiza) la suscripción de un dispositivo.
  async saveSubscription(userId: string, sub: BrowserSubscription) {
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return { ok: false };
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      create: { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
    return { ok: true };
  }

  async removeSubscription(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { ok: true };
  }

  /// Envía un push a todos los dispositivos de un usuario.
  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.enabled) return;
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          );
        } catch (e: any) {
          // 404/410 = suscripción vencida → limpiar.
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {});
          }
        }
      }),
    );
  }
}
