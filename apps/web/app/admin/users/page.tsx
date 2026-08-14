'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface ProviderProfile { discipline?: string | null; npi?: string | null; canPrescribe?: boolean; displayTitle?: string | null; bio?: string | null }
interface User {
  id: string; role: string; firstName: string; lastName: string; phone: string; email?: string | null;
  isActive: boolean; providerProfile?: ProviderProfile | null;
}

const ROLES = [
  { v: 'PROVIDER', l: 'Profesional' },
  { v: 'STAFF', l: 'Personal administrativo' },
  { v: 'STUDENT', l: 'Estudiante / practicante' },
  { v: 'ADMIN', l: 'Administrador' },
];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.v, r.l]));
const DISCIPLINES = [
  'INTERNAL_MEDICINE', 'GENERAL_MEDICINE', 'CHIROPRACTIC', 'DIETETICS', 'NUTRITION',
  'ADDICTION_COUNSELING', 'PSYCHOLOGY', 'PSYCHIATRY', 'GYNECOLOGY', 'EXERCISE_PHYSIOLOGY', 'MASSAGE_THERAPY', 'OTHER',
];
const DISC_LABEL: Record<string, string> = {
  INTERNAL_MEDICINE: 'Medicina interna', GENERAL_MEDICINE: 'Medicina general', CHIROPRACTIC: 'Quiropráctica',
  DIETETICS: 'Dietista', NUTRITION: 'Nutrición', ADDICTION_COUNSELING: 'Consejería de adicciones',
  PSYCHOLOGY: 'Psicología', PSYCHIATRY: 'Psiquiatría', GYNECOLOGY: 'Ginecología',
  EXERCISE_PHYSIOLOGY: 'Fisiología del ejercicio', MASSAGE_THERAPY: 'Masajista', OTHER: 'Otro',
};

const emptyForm = () => ({
  role: 'PROVIDER', firstName: '', lastName: '', phone: '', email: '', password: '',
  discipline: 'INTERNAL_MEDICINE', npi: '', canPrescribe: false, displayTitle: '', bio: '',
});

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async (term: string) => {
    try { setUsers(await api.get<User[]>(`/users${term ? `?q=${encodeURIComponent(term)}` : ''}`)); }
    catch (e: any) { setError(e.message); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 300); return () => clearTimeout(t); }, [q, load]);

  const isPro = form.role === 'PROVIDER' || form.role === 'STUDENT';

  async function create() {
    setError(''); setMsg('');
    try {
      const payload: any = { role: form.role, firstName: form.firstName, lastName: form.lastName, phone: form.phone, password: form.password };
      if (form.email) payload.email = form.email;
      if (isPro) {
        payload.discipline = form.discipline;
        if (form.npi) payload.npi = form.npi;
        payload.canPrescribe = form.canPrescribe;
        if (form.displayTitle) payload.displayTitle = form.displayTitle;
        if (form.bio) payload.bio = form.bio;
      }
      await api.post('/users', payload);
      setMsg('Usuario creado.'); setForm(emptyForm()); setShowNew(false); await load(q);
    } catch (e: any) { setError(e.message); }
  }

  async function toggleActive(u: User) {
    try { await api.post(`/users/${u.id}/active`, { active: !u.isActive }); await load(q); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios / Staff</h1>
        <button className="btn-primary" onClick={() => setShowNew((s) => !s)}>{showNew ? 'Cerrar' : '+ Nuevo usuario'}</button>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {showNew && (
        <div className="card mb-6 grid gap-3 sm:grid-cols-2">
          <div><label className="label">Rol</label>
            <select className="field" value={form.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </div>
          <div /><div><label className="label">Nombre</label><input className="field" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
          <div><label className="label">Apellido</label><input className="field" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
          <div><label className="label">Teléfono</label><input className="field" placeholder="+17875551234" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div><label className="label">Correo (opcional)</label><input className="field" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className="label">Contraseña inicial</label><input className="field" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
          {isPro && <>
            <div><label className="label">Disciplina</label>
              <select className="field" value={form.discipline} onChange={(e) => set('discipline', e.target.value)}>
                {DISCIPLINES.map((d) => <option key={d} value={d}>{DISC_LABEL[d]}</option>)}
              </select>
            </div>
            <div><label className="label">NPI (si aplica)</label><input className="field" value={form.npi} onChange={(e) => set('npi', e.target.value)} /></div>
            <div><label className="label">Título mostrado</label><input className="field" placeholder="Dra. en Quiropráctica" value={form.displayTitle} onChange={(e) => set('displayTitle', e.target.value)} /></div>
            <label className="flex items-center gap-2 self-end"><input type="checkbox" className="h-5 w-5" checked={form.canPrescribe} onChange={(e) => set('canPrescribe', e.target.checked)} /> Puede recetar (firma medicamentos)</label>
            <div className="sm:col-span-2"><label className="label">Biografía (para el Online Booking)</label><textarea className="field" rows={2} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></div>
          </>}
          <div className="sm:col-span-2"><button className="btn-primary" onClick={create}>Crear usuario</button></div>
        </div>
      )}

      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input className="field !pl-11" placeholder="Buscar por nombre, teléfono o correo…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-2">
        {users.map((u) => (
          <div key={u.id} className={`card flex items-center justify-between ${!u.isActive ? 'opacity-60' : ''}`}>
            <div>
              <p className="font-semibold">
                {u.firstName} {u.lastName}
                {!u.isActive && <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Inactivo</span>}
              </p>
              <p className="text-sm text-slate-500">
                {ROLE_LABEL[u.role] ?? u.role} · {u.phone}
                {u.providerProfile?.discipline ? ` · ${DISC_LABEL[u.providerProfile.discipline] ?? u.providerProfile.discipline}` : ''}
                {u.providerProfile?.canPrescribe ? ' · receta ✍️' : ''}
              </p>
            </div>
            <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => toggleActive(u)}>
              {u.isActive ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
