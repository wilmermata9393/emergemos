'use client';

import { useState } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

export default function AssessmentPage() {
  const [answers, setAnswers] = useState({
    chiefComplaint: '',
    chronicConditions: '',
    allergies: '',
    controlledSubstances: false,
    usesTelehealth: false,
  });
  const [done, setDone] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setAnswers((a) => ({ ...a, [k]: v }));

  async function submit() {
    setError('');
    try {
      const r = await api.post<{ triggered: string[] }>('/me/initial-assessment', { answers });
      setDone(r.triggered);
    } catch (e: any) { setError(e.message); }
  }

  if (done) {
    return (
      <PortalShell>
        <div className="card text-center">
          <p className="text-2xl font-bold">✅ ¡Gracias!</p>
          <p className="mt-2 text-slate-600">Tu evaluación inicial fue registrada.</p>
          {done.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
              Según tus respuestas, se agregaron estos consentimientos para firmar:
              <ul className="mt-2 list-inside list-disc">{done.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          <Link href="/portal/consents" className="btn-primary mt-6 inline-block">Ir a mis consentimientos</Link>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Evaluación inicial</h1>
      <p className="mb-6 text-lg text-slate-600">Cuéntanos un poco sobre tu salud. Esto ayuda a tu equipo a prepararse.</p>
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="card space-y-5">
        <div>
          <label className="label text-base">¿Cuál es el motivo principal de tu visita?</label>
          <textarea className="field" rows={2} value={answers.chiefComplaint} onChange={(e) => set('chiefComplaint', e.target.value)} />
        </div>
        <div>
          <label className="label text-base">¿Tienes condiciones crónicas? (diabetes, presión alta, etc.)</label>
          <textarea className="field" rows={2} value={answers.chronicConditions} onChange={(e) => set('chronicConditions', e.target.value)} />
        </div>
        <div>
          <label className="label text-base">¿Tienes alergias?</label>
          <input className="field" value={answers.allergies} onChange={(e) => set('allergies', e.target.value)} />
        </div>
        <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <input type="checkbox" className="h-6 w-6" checked={answers.controlledSubstances} onChange={(e) => set('controlledSubstances', e.target.checked)} />
          <span>¿Recibes o necesitas tratamiento con medicamentos controlados?</span>
        </label>
        <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <input type="checkbox" className="h-6 w-6" checked={answers.usesTelehealth} onChange={(e) => set('usesTelehealth', e.target.checked)} />
          <span>¿Planeas usar telemedicina (citas por video)?</span>
        </label>
        <button className="btn-primary" onClick={submit}>Enviar evaluación</button>
      </div>
    </PortalShell>
  );
}
