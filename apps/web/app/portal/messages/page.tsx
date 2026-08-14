'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface Thread {
  id: string;
  subject: string;
  category: string;
  updatedAt: string;
  messages: { body: string; senderName: string; senderRole: string }[];
  _count: { messages: number };
}

const CATEGORIES = [
  { value: 'APPOINTMENT', label: 'Citas' },
  { value: 'PRESCRIPTION', label: 'Recetas / medicamentos' },
  { value: 'CLINICAL', label: 'Consulta clínica' },
  { value: 'BILLING', label: 'Facturación / seguros' },
  { value: 'GENERAL', label: 'General' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export default function MessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() { setThreads(await api.get<Thread[]>('/me/messages')); }
  useEffect(() => {
    load().catch((e) => setError(e.message));
    // Al abrir Mensajes, los avisos de mensajes se marcan como leídos.
    api.post('/me/notifications/read-messages', {}).then(() => window.dispatchEvent(new Event('rme-check'))).catch(() => {});
  }, []);

  async function send() {
    if (!subject.trim() || !body.trim()) { setError('Escribe el asunto y el mensaje.'); return; }
    setError(''); setSaving(true);
    try {
      const t = await api.post<{ id: string }>('/me/messages', { subject, category, body });
      router.push(`/portal/messages/${t.id}`);
    } catch (e: any) { setError(e.message); setSaving(false); }
  }

  return (
    <PortalShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mensajes</h1>
        <button className="btn-primary" onClick={() => setShowNew((s) => !s)}>{showNew ? 'Cerrar' : '+ Nuevo mensaje'}</button>
      </div>

      {showNew && (
        <div className="card mb-6 space-y-4">
          <div>
            <label className="label text-base">Asunto</label>
            <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej. Duda sobre mi receta" />
          </div>
          <div>
            <label className="label text-base">¿Sobre qué es?</label>
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-base">Mensaje</label>
            <textarea className="field" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
          <button className="btn-primary" onClick={send} disabled={saving}>{saving ? 'Enviando…' : 'Enviar mensaje'}</button>
        </div>
      )}

      {threads.length === 0 && !showNew && <p className="text-slate-500">No tienes conversaciones. Toca “Nuevo mensaje” para empezar.</p>}
      <div className="space-y-2">
        {threads.map((t) => (
          <button key={t.id} onClick={() => router.push(`/portal/messages/${t.id}`)} className="card w-full text-left transition hover:border-brand-500">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">{t.subject}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{CAT_LABEL[t.category] ?? t.category}</span>
            </div>
            {t.messages[0] && (
              <p className="mt-1 truncate text-slate-600">
                <strong>{t.messages[0].senderRole === 'PATIENT' ? 'Tú' : t.messages[0].senderName}:</strong> {t.messages[0].body}
              </p>
            )}
          </button>
        ))}
      </div>
    </PortalShell>
  );
}
