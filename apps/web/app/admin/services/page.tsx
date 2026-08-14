'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Service { id: string; name: string; description?: string | null; durationMin: number; priceCents?: number | null; isActive: boolean }

const emptyForm = () => ({ name: '', description: '', durationMin: '30', priceDollars: '' });

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function load() { try { setServices(await api.get<Service[]>('/services/all')); } catch (e: any) { setError(e.message); } }
  useEffect(() => { load(); }, []);

  async function create() {
    setError(''); setMsg('');
    if (!form.name.trim()) { setError('Escribe el nombre del servicio.'); return; }
    try {
      await api.post('/services', {
        name: form.name,
        description: form.description || undefined,
        durationMin: Number(form.durationMin) || 30,
        priceCents: form.priceDollars ? Math.round(Number(form.priceDollars) * 100) : undefined,
      });
      setMsg('Servicio creado.'); setForm(emptyForm()); setShowNew(false); await load();
    } catch (e: any) { setError(e.message); }
  }

  async function toggle(s: Service) {
    try { await api.post(`/services/${s.id}/active`, { active: !s.isActive }); await load(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <button className="btn-primary" onClick={() => setShowNew((s) => !s)}>{showNew ? 'Cerrar' : '+ Nuevo servicio'}</button>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {showNew && (
        <div className="card mb-6 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Nombre</label><input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Consulta de Nutrición" /></div>
          <div className="sm:col-span-2"><label className="label">Descripción</label><input className="field" value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div><label className="label">Duración (minutos)</label><input className="field" inputMode="numeric" value={form.durationMin} onChange={(e) => set('durationMin', e.target.value)} /></div>
          <div><label className="label">Precio ($)</label><input className="field" inputMode="decimal" value={form.priceDollars} onChange={(e) => set('priceDollars', e.target.value)} placeholder="60" /></div>
          <div className="sm:col-span-2"><button className="btn-primary" onClick={create}>Crear servicio</button></div>
        </div>
      )}

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input className="field !pl-11" placeholder="Buscar servicio…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {services.length === 0 && <p className="text-slate-500">No hay servicios.</p>}
        {services.filter((s) => (s.name + ' ' + (s.description ?? '')).toLowerCase().includes(q.toLowerCase())).map((s) => (
          <div key={s.id} className={`card flex items-center justify-between ${!s.isActive ? 'opacity-60' : ''}`}>
            <div>
              <p className="font-semibold">
                {s.name}
                {!s.isActive && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>}
              </p>
              <p className="text-sm text-slate-500">{s.durationMin} min{s.priceCents != null ? ` · $${(s.priceCents / 100).toFixed(0)}` : ''}{s.description ? ` · ${s.description}` : ''}</p>
            </div>
            <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => toggle(s)}>{s.isActive ? 'Desactivar' : 'Activar'}</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
