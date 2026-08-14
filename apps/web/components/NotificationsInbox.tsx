'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Notif { id: string; type: string; title: string; body: string; readAt?: string | null; createdAt: string }

const ICON: Record<string, string> = {
  APPOINTMENT_REMINDER: '📅', BIRTHDAY: '🎉', FOLLOW_UP: '📋', MESSAGE: '💬', GENERAL: '🔔',
};

export default function NotificationsInbox() {
  const [items, setItems] = useState<Notif[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  // Avisos = todo MENOS los mensajes (esos viven en la pestaña Mensajes).
  async function load() { setItems((await api.get<Notif[]>('/me/notifications')).filter((n) => n.type !== 'MESSAGE')); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function markRead(id: string) {
    try { await api.post(`/me/notifications/${id}/read`, {}); await load(); } catch (e: any) { setError(e.message); }
  }
  async function markAll() {
    try { await api.post('/me/notifications/read-all', {}); await load(); } catch (e: any) { setError(e.message); }
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notificaciones {unread > 0 && <span className="rounded-full bg-brand-600 px-3 py-1 text-base text-white">{unread}</span>}</h1>
        {unread > 0 && <button className="btn-ghost !px-4 !py-2 text-sm" onClick={markAll}>Marcar todas como leídas</button>}
      </div>
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {items.length > 0 && (
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input className="field !pl-11" placeholder="Buscar en tus avisos…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}

      {items.length === 0 && <p className="text-slate-500">No tienes notificaciones.</p>}
      <div className="space-y-2">
        {items.filter((n) => (n.title + ' ' + n.body).toLowerCase().includes(q.toLowerCase())).map((n) => (
          <button
            key={n.id}
            onClick={() => !n.readAt && markRead(n.id)}
            className={`card flex w-full items-start gap-3 text-left ${n.readAt ? 'opacity-60' : 'border-brand-200 bg-brand-50/40'}`}
          >
            <span className="text-2xl">{ICON[n.type] ?? '🔔'}</span>
            <div className="flex-1">
              <p className="font-semibold">{n.title}</p>
              <p className="text-slate-600">{n.body}</p>
              <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('es')}</p>
            </div>
            {!n.readAt && <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}
