'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api, getUser } from '@/lib/api';
import BodyMap from '@/components/note-sections/BodyMap';
import FoodPrescription from '@/components/note-sections/FoodPrescription';
import FollowUp from '@/components/note-sections/FollowUp';

interface Section { key: string; title: string; type: string }
interface NoteVersion { version: number; signedByName: string; signedAt: string; changeReason?: string | null }
interface Note {
  id: string;
  patientId: string;
  authorId: string;
  title: string;
  content: Record<string, any>;
  status: 'DRAFT' | 'SIGNED';
  version: number;
  signedByName?: string | null;
  signedAt?: string | null;
  author: { firstName: string; lastName: string };
  template?: { name: string; schema: { sections: Section[] } } | null;
  versions: NoteVersion[];
}

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState<Record<string, any>>({});
  // Espejo del contenido siempre actualizado, para que guardar/firmar use el
  // valor más reciente sin depender del momento del render.
  const contentRef = useRef<Record<string, any>>({});
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [amending, setAmending] = useState(false);
  const [reason, setReason] = useState('');
  const me = getUser<{ id: string }>();

  const load = useCallback(async () => {
    const n = await api.get<Note>(`/notes/${id}`);
    setNote(n);
    setContent(n.content ?? {});
    contentRef.current = n.content ?? {};
  }, [id]);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  if (error) return <AppShell><p className="text-danger-700">{error}</p></AppShell>;
  if (!note) return <AppShell><p className="text-slate-500">Cargando…</p></AppShell>;

  const isAuthor = me?.id === note.authorId;
  const isSigned = note.status === 'SIGNED';
  const locked = isSigned && !amending;
  const canEdit = isAuthor && (!isSigned || amending);
  const sections: Section[] = note.template?.schema?.sections ?? [{ key: 'body', title: 'Nota', type: 'textarea' }];

  const setField = (k: string, v: any) =>
    setContent((c) => {
      const next = { ...c, [k]: v };
      contentRef.current = next;
      return next;
    });

  async function saveDraft() {
    setError(''); setMsg('');
    try { await api.patch(`/notes/${id}`, { content: contentRef.current }); setMsg('Borrador guardado.'); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function sign() {
    if (!confirm('Al firmar, la nota se bloquea. Para cambiarla después tendrás que crear una enmienda. ¿Firmar ahora?')) return;
    setError(''); setMsg('');
    try { await api.post(`/notes/${id}/sign`, {}); setMsg('Nota firmada.'); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function saveAmendment() {
    if (!reason.trim()) { setError('Indica el motivo de la enmienda.'); return; }
    setError(''); setMsg('');
    try { await api.patch(`/notes/${id}`, { content: contentRef.current, changeReason: reason }); setMsg('Enmienda guardada.'); setAmending(false); setReason(''); await load(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <Link href={`/patients/${note.patientId}`} className="text-brand-600">← Volver al paciente</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{note.title}</h1>
          <p className="text-sm text-slate-500">
            {note.template?.name ?? 'Nota libre'} · Autor: {note.author.firstName} {note.author.lastName}
          </p>
        </div>
        {isSigned ? (
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
            ✓ Firmada v{note.version} · {note.signedByName} · {note.signedAt ? new Date(note.signedAt).toLocaleString('es') : ''}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">Borrador</span>
        )}
      </div>

      {isSigned && !isAuthor && (
        <p className="mt-3 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">Solo lectura: no eres el autor de esta nota.</p>
      )}

      <div className="mt-6 space-y-6">
        {sections.map((s) => (
          <div key={s.key} className="card">
            <h3 className="mb-3 text-lg font-semibold">{s.title}</h3>
            {s.type === 'text' && (
              <input className="field" value={content[s.key] ?? ''} onChange={(e) => setField(s.key, e.target.value)} readOnly={locked || !isAuthor} />
            )}
            {s.type === 'textarea' && (
              <textarea className="field" rows={4} value={content[s.key] ?? ''} onChange={(e) => setField(s.key, e.target.value)} readOnly={locked || !isAuthor} />
            )}
            {s.type === 'bodyMap' && (
              <BodyMap value={content[s.key]} onChange={(v) => setField(s.key, v)} readOnly={locked || !isAuthor} />
            )}
            {s.type === 'foodPrescription' && (
              <FoodPrescription value={content[s.key]} onChange={(v) => setField(s.key, v)} readOnly={locked || !isAuthor} />
            )}
            {s.type === 'followUp' && (
              <FollowUp value={content[s.key]} onChange={(v) => setField(s.key, v)} readOnly={locked || !isAuthor} />
            )}
          </div>
        ))}
      </div>

      {msg && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mt-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {/* Acciones */}
      {canEdit && !amending && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-ghost" onClick={saveDraft}>Guardar borrador</button>
          <button className="btn-primary" onClick={sign}>Firmar nota</button>
        </div>
      )}
      {isSigned && isAuthor && !amending && (
        <div className="mt-6">
          <button className="btn-ghost" onClick={() => setAmending(true)}>Enmendar (editar con motivo)</button>
        </div>
      )}
      {amending && (
        <div className="mt-6 card space-y-3">
          <label className="label">Motivo de la enmienda</label>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Se agregó tratamiento realizado" />
          <div className="flex gap-3">
            <button className="btn-primary" onClick={saveAmendment}>Guardar enmienda</button>
            <button className="btn-ghost" onClick={() => { setAmending(false); setReason(''); setContent(note.content); contentRef.current = note.content; }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Historial de versiones */}
      {note.versions.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-bold">Historial</h2>
          <ul className="space-y-2">
            {note.versions.map((v) => (
              <li key={v.version} className="card !py-3 text-sm">
                <span className="font-semibold">v{v.version}</span> · {v.signedByName} · {new Date(v.signedAt).toLocaleString('es')}
                {v.changeReason ? <span className="text-slate-500"> — {v.changeReason}</span> : <span className="text-slate-500"> — firma inicial</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
