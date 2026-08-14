'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', password: '',
    dateOfBirth: '', sex: 'FEMALE', pronoun: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.pronoun) delete payload.pronoun;
      await api.post('/patients/register', payload);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="card max-w-md text-center">
          <div className="mb-4 flex justify-center"><Logo size="md" /></div>
          <p className="text-2xl font-bold">✅ ¡Registro recibido!</p>
          <p className="mt-3 text-slate-600">
            Tu cuenta quedó <strong>pendiente de aprobación</strong>. El equipo la revisará y podrás
            entrar en cuanto sea aprobada.
          </p>
          <Link href="/login" className="btn-primary mt-6 inline-block">Ir a iniciar sesión</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Logo size="lg" />
          <p className="mt-4 text-slate-500">Crea tu cuenta de paciente</p>
        </div>

        <form onSubmit={submit} className="card grid gap-4 sm:grid-cols-2">
          <div><label className="label">Nombre</label><input className="field" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required /></div>
          <div><label className="label">Apellido</label><input className="field" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required /></div>
          <div className="sm:col-span-2"><label className="label">Teléfono (será tu usuario)</label><input className="field" placeholder="+17875551234" value={form.phone} onChange={(e) => set('phone', e.target.value)} required /></div>
          <div className="sm:col-span-2"><label className="label">Correo (opcional)</label><input className="field" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className="label">Contraseña</label><input className="field" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} /></div>
          <div><label className="label">Fecha de nacimiento</label><input className="field" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} required /></div>
          <div><label className="label">Sexo</label>
            <select className="field" value={form.sex} onChange={(e) => set('sex', e.target.value)}>
              <option value="FEMALE">Femenino</option>
              <option value="MALE">Masculino</option>
              <option value="INTERSEX">Intersexual</option>
              <option value="UNKNOWN">Prefiero no decir</option>
            </select>
          </div>
          <div><label className="label">Pronombre (opcional)</label><input className="field" value={form.pronoun} onChange={(e) => set('pronoun', e.target.value)} placeholder="ella, él, elle…" /></div>

          {error && <div className="sm:col-span-2 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</div>}

          <div className="sm:col-span-2">
            <button className="btn-primary w-full" disabled={saving}>{saving ? 'Enviando…' : 'Crear mi cuenta'}</button>
            <p className="mt-4 text-center text-slate-500">
              ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-brand-700">Inicia sesión</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
