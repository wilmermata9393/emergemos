'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Plan { id: string; name: string; isActive: boolean }

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() { try { setPlans(await api.get<Plan[]>('/insurance-plans/all')); } catch (e: any) { setError(e.message); } }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) { setError('Escribe el nombre del plan.'); return; }
    setError(''); setMsg('');
    try { await api.post('/insurance-plans', { name }); setName(''); setMsg('Plan agregado.'); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function toggle(p: Plan) {
    try { await api.post(`/insurance-plans/${p.id}/active`, { active: !p.isActive }); await load(); }
    catch (e: any) { setError(e.message); }
  }
  async function rename(p: Plan) {
    const newName = prompt('Nuevo nombre del plan:', p.name);
    if (!newName || newName === p.name) return;
    try { await api.patch(`/insurance-plans/${p.id}`, { name: newName }); await load(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-bold">Planes médicos aceptados</h1>
      <p className="mb-6 text-slate-600">Estos son los planes que aparecen al registrar el plan médico de un paciente.</p>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="card mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1"><label className="label">Agregar un plan</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Triple-S Advantage" /></div>
        <button className="btn-primary" onClick={create}>+ Agregar</button>
      </div>

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input className="field !pl-11" placeholder="Buscar plan…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {plans.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
          <div key={p.id} className={`card flex items-center justify-between ${!p.isActive ? 'opacity-60' : ''}`}>
            <span className="font-semibold">{p.name}{!p.isActive && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>}</span>
            <div className="flex gap-2">
              <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => rename(p)}>Editar</button>
              <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => toggle(p)}>{p.isActive ? 'Desactivar' : 'Activar'}</button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
