'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface Entry {
  id: string;
  entryAt: string;
  symptoms?: string | null;
  medications?: string | null;
  mood?: string | null;
  notes?: string | null;
}

const MOODS = ['muy bien', 'bien', 'regular', 'mal', 'muy mal'];
const MOOD_ICON: Record<string, string> = { 'muy bien': '😄', bien: '🙂', regular: '😐', mal: '😕', 'muy mal': '😢' };

export default function DiaryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState('');
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() { setEntries(await api.get<Entry[]>('/me/diary')); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function save() {
    if (!symptoms && !medications && !mood && !notes) { setError('Escribe al menos algo para guardar.'); return; }
    setError(''); setSaving(true);
    try {
      await api.post('/me/diary', { symptoms, medications, mood, notes });
      setSymptoms(''); setMedications(''); setMood(''); setNotes('');
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Mi diario</h1>
      <p className="mb-6 text-lg text-slate-600">Anota cómo te sientes. Esto ayuda a tu equipo de salud.</p>

      <div className="card space-y-4">
        <div>
          <label className="label text-base">¿Cómo te sientes hoy?</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold ${mood === m ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                <span className="text-xl">{MOOD_ICON[m]}</span> {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label text-base">Síntomas</label>
          <textarea className="field" rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Ej. dolor de cabeza, cansancio…" />
        </div>
        <div>
          <label className="label text-base">Medicamentos o suplementos</label>
          <textarea className="field" rows={2} value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Ej. Ibuprofeno 200mg, vitamina D…" />
        </div>
        <div>
          <label className="label text-base">Notas (opcional)</label>
          <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar en mi diario'}</button>
      </div>

      <h2 className="mb-3 mt-8 text-2xl font-bold">Mis registros anteriores</h2>
      {entries.length === 0 && <p className="text-slate-500">Aún no tienes registros.</p>}
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-500">{new Date(e.entryAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              {e.mood && <span className="text-lg">{MOOD_ICON[e.mood] ?? ''} {e.mood}</span>}
            </div>
            {e.symptoms && <p><strong>Síntomas:</strong> {e.symptoms}</p>}
            {e.medications && <p><strong>Medicamentos:</strong> {e.medications}</p>}
            {e.notes && <p className="text-slate-600">{e.notes}</p>}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
