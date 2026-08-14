'use client';

import { useEffect, useRef } from 'react';
import { api, getToken, getUser } from '@/lib/api';

interface Notif { id: string; type: string; title: string; body: string; readAt?: string | null; createdAt: string }

const POLL_MS = 20000;

/// Revisa periódicamente las notificaciones del usuario. Cuando llega una nueva:
///  - muestra una notificación del sistema (como WhatsApp/Facebook), y
///  - suena un timbre corto.
/// También publica el número de no leídas para el contador del menú (evento 'rme-unread').
export default function NotificationWatcher() {
  const seen = useRef<Set<string>>(new Set());
  const inited = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !getToken() || !getUser()) return;
    // Pedir permiso para notificaciones del sistema (una vez).
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch {}

    let stop = false;
    async function poll() {
      try {
        const list = await api.get<Notif[]>('/me/notifications');
        // Separamos: los de tipo MESSAGE cuentan para "Mensajes"; el resto para "Avisos".
        const messages = list.filter((n) => !n.readAt && n.type === 'MESSAGE').length;
        const avisos = list.filter((n) => !n.readAt && n.type !== 'MESSAGE').length;
        window.dispatchEvent(new CustomEvent('rme-unread', { detail: { avisos, messages } }));

        if (!inited.current) {
          list.forEach((n) => seen.current.add(n.id));
          inited.current = true;
          return;
        }
        // Nuevas desde la última revisión (la lista viene de más nueva a más vieja).
        const fresh = list.filter((n) => !seen.current.has(n.id));
        fresh.forEach((n) => seen.current.add(n.id));
        if (fresh.length > 0) {
          notifySystem(fresh[0]);
          ding();
        }
      } catch { /* sin sesión o red: ignorar */ }
    }
    poll();
    const t = setInterval(() => { if (!stop) poll(); }, POLL_MS);
    // Permite forzar una revisión inmediata (ej. tras enviar algo).
    const onCheck = () => { if (!stop) poll(); };
    window.addEventListener('rme-check', onCheck);
    return () => { stop = true; clearInterval(t); window.removeEventListener('rme-check', onCheck); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function notifySystem(n: Notif) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(n.title, { body: n.body, tag: n.id });
      notif.onclick = () => { window.focus(); window.location.href = '/notifications'; };
    }
  } catch { /* algunos navegadores lo bloquean en segundo plano */ }
}

function ding() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start();
    o.stop(ctx.currentTime + 0.36);
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch { /* audio bloqueado sin interacción */ }
}
