'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import AuthImage from './AuthImage';

interface InsuranceCard { id: string; planName?: string | null; memberId?: string | null; frontImageKey?: string | null; backImageKey?: string | null; createdAt: string }
interface Doc { id: string; title: string; category: string; createdAt: string; fileId: string; file: { mimeType: string; originalName: string } }

const CATEGORIES = [
  { value: 'LAB', label: 'Laboratorio' },
  { value: 'RESULT', label: 'Resultado' },
  { value: 'IMAGE', label: 'Imagen' },
  { value: 'CONSENT', label: 'Consentimiento' },
  { value: 'OTHER', label: 'Otro' },
];

export default function PatientFiles({ patientId }: { patientId: string }) {
  const [cards, setCards] = useState<InsuranceCard[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState('');

  // Estado de subida del plan médico
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const [planName, setPlanName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [savingCard, setSavingCard] = useState(false);

  // Estado de subida de documento
  const docRef = useRef<HTMLInputElement>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('LAB');
  const [savingDoc, setSavingDoc] = useState(false);

  async function load() {
    const [c, d] = await Promise.all([
      api.get<InsuranceCard[]>(`/patients/${patientId}/insurance-cards`),
      api.get<Doc[]>(`/patients/${patientId}/documents`),
    ]);
    setCards(c);
    setDocs(d);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, [patientId]);

  async function uploadCard() {
    const front = frontRef.current?.files?.[0];
    const back = backRef.current?.files?.[0];
    if (!front && !back) { setError('Selecciona al menos una imagen (frente o reverso).'); return; }
    setError(''); setSavingCard(true);
    try {
      const fd = new FormData();
      if (front) fd.append('front', front);
      if (back) fd.append('back', back);
      if (planName) fd.append('planName', planName);
      if (memberId) fd.append('memberId', memberId);
      await api.upload(`/patients/${patientId}/insurance-card`, fd);
      setPlanName(''); setMemberId('');
      if (frontRef.current) frontRef.current.value = '';
      if (backRef.current) backRef.current.value = '';
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSavingCard(false); }
  }

  async function uploadDoc() {
    const file = docRef.current?.files?.[0];
    if (!file) { setError('Selecciona un archivo.'); return; }
    setError(''); setSavingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', docTitle || file.name);
      fd.append('category', docCategory);
      await api.upload(`/patients/${patientId}/documents`, fd);
      setDocTitle('');
      if (docRef.current) docRef.current.value = '';
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSavingDoc(false); }
  }

  async function openFile(fileId: string) {
    try {
      const url = await api.blobUrl(`/files/${fileId}`);
      window.open(url, '_blank');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-xl font-bold">Plan médico y documentos</h2>
      {error && <p className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {/* Plan médico */}
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold">Plan médico (tarjeta)</h3>

        {cards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium">{c.planName || 'Plan'} {c.memberId ? `· ${c.memberId}` : ''}</p>
                <div className="grid grid-cols-2 gap-2">
                  {c.frontImageKey && <div><p className="mb-1 text-xs text-slate-400">Frente</p><AuthImage fileId={c.frontImageKey} alt="Frente del plan" className="w-full rounded-lg border" /></div>}
                  {c.backImageKey && <div><p className="mb-1 text-xs text-slate-400">Reverso</p><AuthImage fileId={c.backImageKey} alt="Reverso del plan" className="w-full rounded-lg border" /></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Nombre del plan</label><input className="field" value={planName} onChange={(e) => setPlanName(e.target.value)} /></div>
          <div><label className="label">Número de miembro</label><input className="field" value={memberId} onChange={(e) => setMemberId(e.target.value)} /></div>
          <div><label className="label">Foto del frente</label><input ref={frontRef} type="file" accept="image/*" className="field !py-2" /></div>
          <div><label className="label">Foto del reverso</label><input ref={backRef} type="file" accept="image/*" className="field !py-2" /></div>
        </div>
        <button className="btn-primary" onClick={uploadCard} disabled={savingCard}>{savingCard ? 'Subiendo…' : 'Guardar plan médico'}</button>
      </div>

      {/* Documentos */}
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold">Documentos (laboratorios, resultados…)</h3>

        {docs.length === 0 && <p className="text-slate-500">Sin documentos.</p>}
        <ul className="divide-y divide-slate-100">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs text-slate-500">{d.category} · {new Date(d.createdAt).toLocaleDateString('es')} · {d.file.mimeType}</p>
              </div>
              <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => openFile(d.fileId)}>Ver</button>
            </li>
          ))}
        </ul>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div><label className="label">Título</label><input className="field" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Ej. Laboratorio sangre" /></div>
          <div>
            <label className="label">Categoría</label>
            <select className="field" value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div><label className="label">Archivo</label><input ref={docRef} type="file" accept="image/*,application/pdf" className="field !py-2" /></div>
        </div>
        <button className="btn-primary" onClick={uploadDoc} disabled={savingDoc}>{savingDoc ? 'Subiendo…' : 'Subir documento'}</button>
      </div>
    </div>
  );
}
