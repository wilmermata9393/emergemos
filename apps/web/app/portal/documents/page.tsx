'use client';

import { useEffect, useRef, useState } from 'react';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface Doc {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  file: { mimeType: string; originalName: string };
}

const CATEGORIES = [
  { value: 'LAB', label: 'Laboratorio' },
  { value: 'RESULT', label: 'Resultado' },
  { value: 'IMAGE', label: 'Imagen' },
  { value: 'OTHER', label: 'Otro' },
];

export default function PortalDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('LAB');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() { setDocs(await api.get<Doc[]>('/me/documents')); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Elige un archivo (foto o PDF).'); return; }
    setError(''); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title || file.name);
      fd.append('category', category);
      await api.upload('/me/documents', fd);
      setTitle('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function view(id: string) {
    try {
      const url = await api.blobUrl(`/me/documents/${id}/file`);
      window.open(url, '_blank');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Mis documentos</h1>
      <p className="mb-6 text-lg text-slate-600">Aquí puedes ver y subir tus laboratorios, resultados e imágenes.</p>

      <div className="card space-y-4">
        <h2 className="text-xl font-bold">Subir un documento</h2>
        <div>
          <label className="label text-base">¿Qué es?</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Resultado de sangre" />
        </div>
        <div>
          <label className="label text-base">Tipo</label>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-base">Archivo (foto o PDF)</label>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="field !py-2" />
        </div>
        {error && <p className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
        <button className="btn-primary" onClick={upload} disabled={saving}>{saving ? 'Subiendo…' : 'Subir documento'}</button>
      </div>

      <h2 className="mb-3 mt-8 text-2xl font-bold">Mis archivos</h2>
      {docs.length === 0 && <p className="text-slate-500">Aún no tienes documentos.</p>}
      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id} className="card flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{d.title}</p>
              <p className="text-sm text-slate-500">{new Date(d.createdAt).toLocaleDateString('es')} · {d.file.mimeType}</p>
            </div>
            <button className="btn-ghost" onClick={() => view(d.id)}>Ver</button>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
