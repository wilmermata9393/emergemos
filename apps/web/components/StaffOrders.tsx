'use client';

import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';

interface LabTest { id: string; code?: string | null; name: string; category?: string | null }
interface LabOrder { id: string; status: string; notes?: string | null; createdAt: string; orderedByName?: string | null; items: { name: string }[] }
interface MedOrder {
  id: string; drugName: string; dose: string; route?: string | null; frequency: string;
  durationDays?: number | null; quantity?: string | null; refills: number; instructions?: string | null;
  status: string; signedAt?: string | null; prescriberName?: string | null; createdAt: string;
}

const LAB_STATUS: Record<string, string> = { ORDERED: 'Ordenada', COLLECTED: 'Muestra tomada', RESULTED: 'Con resultados', CANCELLED: 'Cancelada' };

export default function StaffOrders({ patientId }: { patientId: string }) {
  const me = getUser<{ role: string }>();
  const isProvider = me?.role === 'PROVIDER';

  const [tests, setTests] = useState<LabTest[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [medOrders, setMedOrders] = useState<MedOrder[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [labNotes, setLabNotes] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Formulario de receta
  const [med, setMed] = useState({ drugName: '', dose: '', route: 'oral', frequency: '', durationDays: '', quantity: '', refills: '0', instructions: '' });
  const [signingId, setSigningId] = useState<string | null>(null);
  const [password, setPassword] = useState('');

  async function load() {
    const [lo, mo] = await Promise.all([
      api.get<LabOrder[]>(`/patients/${patientId}/lab-orders`),
      api.get<MedOrder[]>(`/patients/${patientId}/medication-orders`),
    ]);
    setLabOrders(lo); setMedOrders(mo);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
    api.get<LabTest[]>('/lab-tests').then(setTests).catch(() => {});
  }, [patientId]);

  async function createLabOrder() {
    const items = tests.filter((t) => selected[t.id]).map((t) => ({ name: t.name, code: t.code ?? undefined }));
    if (items.length === 0) { setError('Selecciona al menos una prueba.'); return; }
    setError(''); setMsg('');
    try {
      await api.post(`/patients/${patientId}/lab-orders`, { items, notes: labNotes || undefined });
      setSelected({}); setLabNotes(''); setMsg('Orden de laboratorio creada.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function createMed() {
    if (!med.drugName || !med.dose || !med.frequency) { setError('Completa medicamento, dosis y frecuencia.'); return; }
    setError(''); setMsg('');
    try {
      await api.post(`/patients/${patientId}/medication-orders`, {
        drugName: med.drugName, dose: med.dose, route: med.route, frequency: med.frequency,
        durationDays: med.durationDays ? Number(med.durationDays) : undefined,
        quantity: med.quantity || undefined, refills: Number(med.refills || 0), instructions: med.instructions || undefined,
      });
      setMed({ drugName: '', dose: '', route: 'oral', frequency: '', durationDays: '', quantity: '', refills: '0', instructions: '' });
      setMsg('Receta creada (borrador). Fírmala para que sea válida.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function sign(id: string) {
    if (!password) { setError('Escribe tu contraseña para firmar.'); return; }
    setError(''); setMsg('');
    try {
      await api.post(`/medication-orders/${id}/sign`, { password });
      setSigningId(null); setPassword(''); setMsg('Receta firmada.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  const grouped = tests.reduce<Record<string, LabTest[]>>((acc, t) => {
    const k = t.category ?? 'Otros';
    (acc[k] = acc[k] ?? []).push(t);
    return acc;
  }, {});

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xl font-bold">Órdenes</h2>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Laboratorios */}
        <div className="card">
          <h3 className="mb-3 text-lg font-semibold">Orden de laboratorio</h3>
          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase text-slate-400">{cat}</p>
                {list.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 py-1">
                    <input type="checkbox" checked={!!selected[t.id]} onChange={(e) => setSelected((s) => ({ ...s, [t.id]: e.target.checked }))} className="h-5 w-5" />
                    <span>{t.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <input className="field mt-3" placeholder="Notas (ej. ayuno 12h)" value={labNotes} onChange={(e) => setLabNotes(e.target.value)} />
          <button className="btn-primary mt-3 !py-2 text-sm" onClick={createLabOrder}>Crear orden de laboratorio</button>

          <div className="mt-4 space-y-2">
            {labOrders.map((o) => (
              <div key={o.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{new Date(o.createdAt).toLocaleDateString('es')}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{LAB_STATUS[o.status] ?? o.status}</span>
                </div>
                <p className="text-slate-600">{o.items.map((i) => i.name).join(', ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recetas */}
        <div className="card">
          <h3 className="mb-3 text-lg font-semibold">Receta de medicamento</h3>
          {!isProvider && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Solo un profesional (PROVIDER) puede crear y firmar recetas.</p>}
          {isProvider && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input className="field !py-2" placeholder="Medicamento" value={med.drugName} onChange={(e) => setMed({ ...med, drugName: e.target.value })} />
                <input className="field !py-2" placeholder="Dosis (ej. 400 mg)" value={med.dose} onChange={(e) => setMed({ ...med, dose: e.target.value })} />
                <input className="field !py-2" placeholder="Vía (ej. oral)" value={med.route} onChange={(e) => setMed({ ...med, route: e.target.value })} />
                <input className="field !py-2" placeholder="Frecuencia (ej. cada 8h)" value={med.frequency} onChange={(e) => setMed({ ...med, frequency: e.target.value })} />
                <input className="field !py-2" placeholder="Días" inputMode="numeric" value={med.durationDays} onChange={(e) => setMed({ ...med, durationDays: e.target.value })} />
                <input className="field !py-2" placeholder="Cantidad (ej. 15 tab)" value={med.quantity} onChange={(e) => setMed({ ...med, quantity: e.target.value })} />
                <input className="field !py-2" placeholder="Refills" inputMode="numeric" value={med.refills} onChange={(e) => setMed({ ...med, refills: e.target.value })} />
              </div>
              <input className="field !py-2" placeholder="Instrucciones" value={med.instructions} onChange={(e) => setMed({ ...med, instructions: e.target.value })} />
              <button className="btn-primary !py-2 text-sm" onClick={createMed}>Crear receta (borrador)</button>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {medOrders.map((m) => (
              <div key={m.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{m.drugName} {m.dose}</span>
                  {m.status === 'SIGNED' ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">✓ Firmada</span>
                  ) : m.status === 'CANCELLED' ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">Cancelada</span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Borrador</span>
                  )}
                </div>
                <p className="text-slate-600">{m.frequency}{m.durationDays ? ` · ${m.durationDays} días` : ''}{m.quantity ? ` · ${m.quantity}` : ''}{m.refills ? ` · ${m.refills} refills` : ''}</p>
                {m.instructions && <p className="text-slate-500">{m.instructions}</p>}
                {m.status === 'SIGNED' && <p className="mt-1 text-xs text-green-700">Firmada por {m.prescriberName} · {m.signedAt ? new Date(m.signedAt).toLocaleString('es') : ''}</p>}

                {isProvider && m.status === 'DRAFT' && (
                  signingId === m.id ? (
                    <div className="mt-2 flex gap-2">
                      <input type="password" className="field !py-2" placeholder="Tu contraseña para firmar" value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button className="btn-primary !py-2 text-sm" onClick={() => sign(m.id)}>Firmar</button>
                      <button className="btn-ghost !py-2 text-sm" onClick={() => { setSigningId(null); setPassword(''); }}>✕</button>
                    </div>
                  ) : (
                    <button className="btn-ghost mt-2 !px-4 !py-1.5 text-sm" onClick={() => { setSigningId(m.id); setPassword(''); }}>🔒 Firmar receta</button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
