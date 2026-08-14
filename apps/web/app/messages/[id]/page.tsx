'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Msg { id: string; body: string; senderName: string; senderRole: string; createdAt: string }
interface Thread { id: string; subject: string; category: string; messages: Msg[] }

export default function StaffThreadPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setThread(await api.get<Thread>(`/message-threads/${id}`)); } catch (e: any) { setError(e.message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function send() {
    if (!reply.trim()) return;
    setError('');
    try { await api.post(`/message-threads/${id}/reply`, { body: reply }); setReply(''); await load(); }
    catch (e: any) { setError(e.message); }
  }

  if (!thread) return <AppShell><p className="text-slate-500">Cargando…</p></AppShell>;

  return (
    <AppShell>
      <Link href="/messages" className="text-sm text-slate-500 hover:text-brand-700">← Mensajes</Link>
      <h1 className="mb-4 mt-1 text-2xl font-bold">{thread.subject}</h1>
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="mb-4 space-y-3">
        {thread.messages.map((m) => {
          return (
            <div key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.senderRole === 'PATIENT' ? 'bg-slate-100' : 'ml-auto bg-brand-600 text-white'}`}>
              <p className={`text-xs ${m.senderRole === 'PATIENT' ? 'text-slate-500' : 'text-white/80'}`}>
                {m.senderName} · {new Date(m.createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
              <p>{m.body}</p>
            </div>
          );
        })}
      </div>

      <div className="card">
        <textarea className="field min-h-[90px]" placeholder="Escribe tu respuesta…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <button className="btn-primary mt-3" onClick={send}>Enviar</button>
      </div>
    </AppShell>
  );
}
