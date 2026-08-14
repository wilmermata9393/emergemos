'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Template { id: string; name: string; discipline?: string | null; schema: { sections: { title: string; type: string }[] } }

const SECTION_TYPES = [
  { v: 'textarea', l: 'Texto largo' },
  { v: 'text', l: 'Texto corto' },
  { v: 'foodPrescription', l: 'Prescripción de alimentos' },
  { v: 'bodyMap', l: 'Diagrama del cuerpo (dolor)' },
  { v: 'followUp', l: 'Próxima cita' },
];
const DISCIPLINES = ['', 'INTERNAL_MEDICINE', 'NUTRITION', 'CHIROPRACTIC', 'PSYCHOLOGY', 'PSYCHIATRY', 'GYNECOLOGY', 'OTHER'];
const DISC_LABEL: Record<string, string> = {
  '': 'General', INTERNAL_MEDICINE: 'Medicina interna', NUTRITION: 'Nutrición', CHIROPRACTIC: 'Quiropráctica',
  PSYCHOLOGY: 'Psicología', PSYCHIATRY: 'Psiquiatría', GYNECOLOGY: 'Ginecología', OTHER: 'Otro',
};
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'seccion';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [sections, setSections] = useState([{ title: '', type: 'textarea' }]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() { try { setTemplates(await api.get<Template[]>('/note-templates')); } catch (e: any) { setError(e.message); } }
  useEffect(() => { load(); }, []);

  const setSec = (i: number, k: string, v: string) => setSections((s) => s.map((row, j) => (j === i ? { ...row, [k]: v } : row)));

  async function create() {
    setError(''); setMsg('');
    if (!name.trim()) { setError('Escribe el nombre de la plantilla.'); return; }
    const secs = sections.filter((s) => s.title.trim()).map((s) => ({ key: slug(s.title), title: s.title, type: s.type }));
    if (secs.length === 0) { setError('Agrega al menos una sección con título.'); return; }
    try {
      await api.post('/note-templates', { name, discipline: discipline || undefined, sections: secs });
      setName(''); setDiscipline(''); setSections([{ title: '', type: 'textarea' }]); setShowNew(false);
      setMsg('Plantilla creada.'); await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plantillas de notas</h1>
        <button className="btn-primary" onClick={() => setShowNew((s) => !s)}>{showNew ? 'Cerrar' : '+ Nueva plantilla'}</button>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {showNew && (
        <div className="card mb-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Nombre de la plantilla</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Nota de Fisioterapia" /></div>
            <div><label className="label">Disciplina</label>
              <select className="field" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                {DISCIPLINES.map((d) => <option key={d} value={d}>{DISC_LABEL[d]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="label">Secciones (lo que el profesional llenará)</p>
            <div className="space-y-2">
              {sections.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field !py-2" placeholder="Título de la sección" value={s.title} onChange={(e) => setSec(i, 'title', e.target.value)} />
                  <select className="field !w-56 !py-2" value={s.type} onChange={(e) => setSec(i, 'type', e.target.value)}>
                    {SECTION_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                  </select>
                  <button className="text-danger-600" onClick={() => setSections((ss) => ss.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button className="btn-ghost mt-2 !py-2 text-sm" onClick={() => setSections((s) => [...s, { title: '', type: 'textarea' }])}>+ Agregar sección</button>
          </div>
          <button className="btn-primary" onClick={create}>Crear plantilla</button>
        </div>
      )}

      <div className="grid gap-2">
        {templates.map((t) => (
          <div key={t.id} className="card">
            <p className="font-semibold">{t.name} <span className="text-sm text-slate-500">· {DISC_LABEL[t.discipline ?? ''] ?? t.discipline}</span></p>
            <p className="text-sm text-slate-500">{t.schema?.sections?.map((s) => s.title).join(' · ')}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
