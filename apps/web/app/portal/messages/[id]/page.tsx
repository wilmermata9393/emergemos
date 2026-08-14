'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface Msg { id: string; body: string; senderName: string; senderRole: string; createdAt: string }
interface Thread { id: string; subject: string; messages: Msg[] }

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => { setThread(await api.get<Thread>(`/me/messages/${id}`)); }, [id]);
  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  async function reply() {
    if (!body.trim()) return;
    setSending(true); setError('');
    try { await api.post(`/me/messages/${id}/reply`, { body }); setBody(''); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  }

  if (error) return <PortalShell><p className="text-danger-700">{error}</p></PortalShell>;
  if (!thread) return <PortalShell><p className="text-slate-500">Cargando…</p></PortalShell>;

  return (
    <PortalShell>
      <Link href="/portal/messages" className="text-brand-600">← Mis mensajes</Link>
      <h1 className="mt-3 mb-6 text-2xl font-bold">{thread.subject}</h1>

      <div className="space-y-3">
        {thread.messages.map((m) => {
          const mine = m.senderRole === 'PATIENT';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200'}`}>
                <p className={`mb-1 text-xs ${mine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {mine ? 'Tú' : m.senderName} · {new Date(m.createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        <textarea className="field" rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe tu respuesta…" />
        <button className="btn-primary self-end" onClick={reply} disabled={sending}>{sending ? '…' : 'Enviar'}</button>
      </div>
    </PortalShell>
  );
}
