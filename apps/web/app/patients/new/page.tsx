'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    dateOfBirth: '',
    sex: 'UNKNOWN',
    pronoun: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.pronoun) delete payload.pronoun;
      const created = await api.post<{ id: string }>('/patients', payload);
      router.replace(`/patients/${created.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">Nuevo paciente</h1>

      <form onSubmit={onSubmit} className="card grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Nombre</label>
          <input className="field" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
        </div>
        <div>
          <label className="label">Apellido</label>
          <input className="field" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
        </div>
        <div>
          <label className="label">Teléfono (será su usuario)</label>
          <input className="field" placeholder="+17875551234" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
        </div>
        <div>
          <label className="label">Correo (opcional)</label>
          <input className="field" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Contraseña inicial</label>
          <input className="field" type="text" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
        </div>
        <div>
          <label className="label">Fecha de nacimiento</label>
          <input className="field" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required />
        </div>
        <div>
          <label className="label">Sexo</label>
          <select className="field" value={form.sex} onChange={(e) => set('sex', e.target.value)}>
            <option value="FEMALE">Femenino</option>
            <option value="MALE">Masculino</option>
            <option value="INTERSEX">Intersexual</option>
            <option value="UNKNOWN">No especificado</option>
          </select>
        </div>
        <div>
          <label className="label">Pronombre (opcional)</label>
          <input className="field" placeholder="ella, él, elle…" value={form.pronoun} onChange={(e) => set('pronoun', e.target.value)} />
        </div>

        {error && (
          <div className="sm:col-span-2 rounded-lg bg-danger-50 px-4 py-3 text-danger-700" role="alert">
            {error}
          </div>
        )}

        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar paciente'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </form>
    </AppShell>
  );
}
