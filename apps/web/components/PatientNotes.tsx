'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Template { id: string; name: string; discipline?: string | null }
interface NoteItem {
  id: string;
  title: string;
  status: 'DRAFT' | 'SIGNED';
  version: number;
  createdAt: string;
  author: { firstName: string; lastName: string };
  template?: { name: string } | null;
}

export default function PatientNotes({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [n, t] = await Promise.all([
      api.get<NoteItem[]>(`/patients/${patientId}/notes`),
      api.get<Template[]>(`/note-templates`),
    ]);
    setNotes(n);
    setTemplates(t);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, [patientId]);

  async function createNote() {
    if (!title.trim()) { setError('Escribe un título para la nota.'); return; }
    setError(''); setCreating(true);
    try {
      const created = await api.post<{ id: string }>(`/patients/${patientId}/notes`, {
        title,
        templateId: templateId || undefined,
      });
      router.push(`/notes/${created.id}`);
    } catch (e: any) {
      setError(e.message);
      setCreating(false);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xl font-bold">Notas clínicas</h2>

      <div className="card mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label">Plantilla</label>
          <select className="field" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Nota libre (sin plantilla)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Título</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Consulta inicial" />
        </div>
        <button className="btn-primary" onClick={createNote} disabled={creating}>
          {creating ? 'Creando…' : '+ Nueva nota'}
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {notes.length === 0 && <p className="text-slate-500">Aún no hay notas.</p>}
      <div className="grid gap-2">
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => router.push(`/notes/${n.id}`)}
            className="card flex items-center justify-between text-left transition hover:border-brand-500"
          >
            <div>
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-slate-500">
                {n.template?.name ?? 'Nota libre'} · {n.author.firstName} {n.author.lastName} · {new Date(n.createdAt).toLocaleDateString('es')}
              </p>
            </div>
            {n.status === 'SIGNED' ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Firmada v{n.version}</span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Borrador</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
