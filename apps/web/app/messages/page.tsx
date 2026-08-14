'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Thread {
  id: string; subject: string; category: string; updatedAt: string;
  patient: { user: { firstName: string; lastName: string } };
  messages: { body: string; senderName: string; senderRole: string; createdAt: string }[];
  _count: { messages: number };
}

const CAT_LABEL: Record<string, string> = {
  APPOINTMENT: 'Citas', PRESCRIPTION: 'Recetas / medicamentos', CLINICAL: 'Consulta clínica', GENERAL: 'General',
};

export default function StaffMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.get<Thread[]>('/message-threads').then(setThreads).catch((e) => setError(e.message)); }, []);

  const filtered = threads.filter((t) => {
    const name = `${t.patient.user.firstName} ${t.patient.user.lastName}`.toLowerCase();
    return (name + ' ' + t.subject).toLowerCase().includes(q.toLowerCase());
  });

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Mensajes</h1>
      <p className="mb-6 text-slate-600">Conversaciones con tus pacientes.</p>
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input className="field !pl-11" placeholder="Buscar por paciente o asunto…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 && <p className="text-slate-500">No hay mensajes.</p>}
      <div className="grid gap-2">
        {filtered.map((t) => {
          const last = t.messages[0];
          return (
            <Link key={t.id} href={`/messages/${t.id}`} className="card transition hover:border-brand-500 hover:shadow">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{t.patient.user.firstName} {t.patient.user.lastName}</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{CAT_LABEL[t.category] ?? t.category}</span>
              </div>
              <p className="text-sm font-medium text-slate-700">{t.subject}</p>
              {last && <p className="mt-1 truncate text-sm text-slate-500"><span className="font-medium">{last.senderName}:</span> {last.body}</p>}
              <p className="mt-1 text-xs text-slate-400">{new Date(t.updatedAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })} · {t._count.messages} mensaje(s)</p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
