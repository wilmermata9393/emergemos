'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface MedOrder {
  id: string; drugName: string; dose: string; route?: string | null; frequency: string;
  durationDays?: number | null; quantity?: string | null; refills: number; instructions?: string | null;
  signedAt?: string | null; prescriberName?: string | null;
}
interface LabOrder { id: string; status: string; notes?: string | null; createdAt: string; orderedByName?: string | null; items: { name: string }[] }

const LAB_STATUS: Record<string, { label: string; cls: string }> = {
  ORDERED: { label: 'Ordenada', cls: 'bg-amber-100 text-amber-800' },
  COLLECTED: { label: 'Muestra tomada', cls: 'bg-blue-100 text-blue-800' },
  RESULTED: { label: 'Con resultados', cls: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-slate-200 text-slate-600' },
};

export default function PrescriptionsPage() {
  const [meds, setMeds] = useState<MedOrder[]>([]);
  const [labs, setLabs] = useState<LabOrder[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<MedOrder[]>('/me/medication-orders').then(setMeds).catch((e) => setError(e.message));
    api.get<LabOrder[]>('/me/lab-orders').then(setLabs).catch(() => {});
  }, []);

  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Recetas y laboratorios</h1>
      <p className="mb-6 text-lg text-slate-600">Aquí están tus recetas de medicamentos y las órdenes de laboratorio.</p>
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <h2 className="mb-3 text-2xl font-bold">💊 Mis recetas</h2>
      {meds.length === 0 && <p className="mb-6 text-slate-500">No tienes recetas por ahora.</p>}
      <div className="mb-8 space-y-3">
        {meds.map((m) => (
          <div key={m.id} className="card">
            <p className="text-xl font-bold">{m.drugName} — {m.dose}</p>
            <p className="text-slate-700">{m.frequency}{m.route ? ` · ${m.route}` : ''}{m.durationDays ? ` · por ${m.durationDays} días` : ''}</p>
            {m.quantity && <p className="text-slate-600">Cantidad: {m.quantity} · Refills: {m.refills}</p>}
            {m.instructions && <p className="mt-1 rounded-lg bg-brand-50 px-3 py-2 text-brand-800">📋 {m.instructions}</p>}
            <p className="mt-2 text-sm text-slate-500">Recetada por {m.prescriberName} · {m.signedAt ? new Date(m.signedAt).toLocaleDateString('es', { dateStyle: 'long' }) : ''}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-2xl font-bold">🧪 Mis órdenes de laboratorio</h2>
      {labs.length === 0 && <p className="text-slate-500">No tienes órdenes de laboratorio.</p>}
      <div className="space-y-3">
        {labs.map((o) => (
          <div key={o.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleDateString('es', { dateStyle: 'long' })}</span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${LAB_STATUS[o.status]?.cls}`}>{LAB_STATUS[o.status]?.label ?? o.status}</span>
            </div>
            <ul className="list-inside list-disc text-slate-700">
              {o.items.map((i, idx) => <li key={idx}>{i.name}</li>)}
            </ul>
            {o.notes && <p className="mt-2 text-sm text-slate-500">Nota: {o.notes}</p>}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
