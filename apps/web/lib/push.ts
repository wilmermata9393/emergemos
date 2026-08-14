// Activación de notificaciones push (Web Push) en el navegador.
import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/// Pide permiso, registra el service worker y suscribe este dispositivo al push.
export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: 'Este navegador no soporta notificaciones push.' };
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, error: 'Debes permitir las notificaciones para recibirlas.' };

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const { key } = await api.get<{ key: string }>('/push/vapid-public-key');
    if (!key) return { ok: false, error: 'El servidor aún no tiene el push configurado.' };

    // Reutiliza la suscripción existente si ya hay una.
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    await api.post('/me/push/subscribe', sub.toJSON());
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'No se pudo activar el push.' };
  }
}
