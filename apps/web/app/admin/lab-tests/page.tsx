'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface LabTest { id: string; name: string; code?: string | null; category?: string | null; isActive: boolean }

export default function AdminLabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', code: '', category: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function load() { try { setTests(await api.get<LabTest[]>('/lab-tests/all')); } catch (e: any) { setError(e.message); } }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.name.trim()) { setError('Escribe el nombre de la prueba.'); return; }
    setError(''); setMsg('');
    try {
      await api.post('/lab-tests', { name: form.name, code: form.code || undefined, category: form.category || undefined });
      setForm({ name: '', code: '', category: '' }); setMsg('Prueba agregada.'); await load();
    } catch (e: any) { setError(e.message); }
  }
  async function toggle(t: LabTest) {
    try { await api.post(`/lab-tests/${t.id}/active`, { active: !t.isActive }); await load(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-bold">Catálogo de laboratorios</h1>
      <p className="mb-6 text-slate-600">Estas pruebas aparecen en el checklist al crear una orden de laboratorio.</p>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="card mb-6 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><label className="label">Nombre de la prueba</label><input className="field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Vitamina B12" /></div>
        <div><label className="label">Código (opc.)</label><input className="field" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="B12" /></div>
        <div><label className="label">Categoría (opc.)</label><input className="field" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Vitaminas" /></div>
        <div className="sm:col-span-4"><button className="btn-primary" onClick={create}>+ Agregar prueba</button></div>
      </div>

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input className="field !pl-11" placeholder="Buscar prueba…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {tests.filter((t) => (t.name + ' ' + (t.category ?? '')).toLowerCase().includes(q.toLowerCase())).map((t) => (
          <div key={t.id} className={`card flex items-center justify-between ${!t.isActive ? 'opacity-60' : ''}`}>
            <span>
              <span className="font-semibold">{t.name}</span>
              {t.category ? <span className="text-sm text-slate-500"> · {t.category}</span> : ''}
              {!t.isActive && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>}
            </span>
            <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => toggle(t)}>{t.isActive ? 'Desactivar' : 'Activar'}</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
