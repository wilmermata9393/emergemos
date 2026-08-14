'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Msg { id: string; body: string; senderName: string; senderRole: string; createdAt: string }
interface Thread { id: string; subject: string; category: string; updatedAt: string; messages: Msg[]; _count?: { messages: number } }

const CAT_LABEL: Record<string, string> = {
  APPOINTMENT: 'Citas', PRESCRIPTION: 'Recetas', CLINICAL: 'Clínica', BILLING: 'Facturación', GENERAL: 'General',
};

export default function StaffMessages({ patientId }: { patientId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [full, setFull] = useState<Thread | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  async function load() { setThreads(await api.get<Thread[]>(`/patients/${patientId}/message-threads`)); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, [patientId]);

  async function open(id: string) {
    if (openId === id) { setOpenId(null); setFull(null); return; }
    setOpenId(id);
    setFull(await api.get<Thread>(`/message-threads/${id}`));
  }

  async function send() {
    if (!reply.trim() || !openId) return;
    try {
      await api.post(`/message-threads/${openId}/reply`, { body: reply });
      setReply('');
      setFull(await api.get<Thread>(`/message-threads/${openId}`));
      await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xl font-bold">Mensajes del paciente</h2>
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
      {threads.length === 0 && <p className="text-slate-500">Sin mensajes.</p>}
      <div className="space-y-2">
        {threads.map((t) => (
          <div key={t.id} className="card">
            <button className="flex w-full items-center justify-between text-left" onClick={() => open(t.id)}>
              <span className="font-semibold">{t.subject}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{CAT_LABEL[t.category] ?? t.category}</span>
            </button>

            {openId === t.id && full && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {full.messages.map((m) => {
                  const staff = m.senderRole !== 'PATIENT';
                  return (
                    <div key={m.id} className={`flex ${staff ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${staff ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white'}`}>
                        <p className={`mb-1 text-xs ${staff ? 'text-brand-100' : 'text-slate-400'}`}>{m.senderName} · {new Date(m.createdAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2">
                  <textarea className="field !py-2" rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Responder…" />
                  <button className="btn-primary self-end" onClick={send}>Enviar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
