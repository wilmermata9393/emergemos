'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface InsuranceCard { id: string; planName?: string | null; memberId?: string | null; hasFront: boolean; hasBack: boolean }
interface Profile {
  mrn: string;
  dateOfBirth: string;
  sex: string;
  hasAvatar: boolean;
  addressLine?: string | null; city?: string | null; state?: string | null; zip?: string | null;
  emergencyContactName?: string | null; emergencyContactPhone?: string | null;
  user: { firstName: string; lastName: string; phone: string; email?: string | null; pronoun?: string | null };
  insuranceCards: InsuranceCard[];
}

const SEX_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Femenino', OTHER: 'Otro', UNKNOWN: 'No indicado' };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function PatientProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Campos editables por el paciente.
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  async function load() {
    try {
      const data = await api.get<Profile>('/me/profile');
      setP(data);
      setPhone(data.user.phone ?? ''); setEmail(data.user.email ?? '');
      setAddressLine(data.addressLine ?? ''); setCity(data.city ?? ''); setState(data.state ?? ''); setZip(data.zip ?? '');
      if (data.hasAvatar) { try { setAvatarUrl(await api.blobUrl('/me/avatar')); } catch {} }
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function save() {
    setMsg(''); setError('');
    try {
      await api.patch('/me/profile', { phone, email, addressLine, city, state, zip });
      setMsg('Datos actualizados.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg(''); setError('');
    try {
      const form = new FormData();
      form.append('file', f);
      await api.upload('/me/avatar', form);
      setMsg('Foto actualizada.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  if (!p) return <PortalShell><p className="text-slate-500">Cargando…</p></PortalShell>;

  return (
    <PortalShell>
      <h1 className="mb-6 text-3xl font-bold">Mi perfil</h1>
      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {/* Foto + nombre */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
          {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" /> : <span>{p.user.firstName[0]}{p.user.lastName[0]}</span>}
        </div>
        <div>
          <p className="text-2xl font-bold">{p.user.firstName} {p.user.lastName}</p>
          <p className="text-slate-500">MRN: {p.mrn}</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
          <button className="btn-ghost mt-2 !px-4 !py-2 text-sm" onClick={() => fileRef.current?.click()}>📷 Cambiar foto</button>
        </div>
      </div>

      {/* Datos que SOLO ve (los edita el equipo) */}
      <div className="card mb-6">
        <h2 className="mb-3 text-xl font-bold">Mis datos</h2>
        <p className="mb-4 text-sm text-slate-500">Estos datos los actualiza tu equipo de salud. Si algo está incorrecto, avísale por Mensajes.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fecha de nacimiento" value={fmtDate(p.dateOfBirth)} />
          <Field label="Sexo" value={SEX_LABEL[p.sex] ?? p.sex} />
          <Field label="Pronombre" value={p.user.pronoun || '—'} />
          <Field label="Contacto de emergencia" value={p.emergencyContactName ? `${p.emergencyContactName} · ${p.emergencyContactPhone ?? ''}` : '—'} />
        </div>
      </div>

      {/* Datos editables por el paciente */}
      <div className="card mb-6">
        <h2 className="mb-1 text-xl font-bold">Contacto (puedes editar)</h2>
        <p className="mb-4 text-sm text-slate-500">Solo puedes cambiar tu teléfono, correo y dirección.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Teléfono</label><input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+17875551234" /></div>
          <div><label className="label">Correo electrónico</label><input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" /></div>
          <div className="sm:col-span-2"><label className="label">Dirección</label><input className="field" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Calle y número" /></div>
          <div><label className="label">Ciudad</label><input className="field" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div><label className="label">Estado</label><input className="field" value={state} onChange={(e) => setState(e.target.value)} /></div>
          <div><label className="label">Código postal</label><input className="field" value={zip} onChange={(e) => setZip(e.target.value)} /></div>
        </div>
        <button className="btn-primary mt-4" onClick={save}>Guardar cambios</button>
      </div>

      {/* Plan médico */}
      <div className="card mb-6">
        <h2 className="mb-3 text-xl font-bold">Mi plan médico</h2>
        {p.insuranceCards.length === 0 && <p className="text-slate-500">Aún no hay un plan registrado. Tu equipo lo agregará.</p>}
        <div className="space-y-4">
          {p.insuranceCards.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold">{c.planName || 'Plan'} {c.memberId ? <span className="text-slate-500">· # Plan: {c.memberId}</span> : null}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {c.hasFront && <InsuranceImg cardId={c.id} side="front" label="Frente" />}
                {c.hasBack && <InsuranceImg cardId={c.id} side="back" label="Dorso" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <h2 className="mb-3 text-xl font-bold">Mi historial</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/portal/appointments" className="rounded-xl border border-slate-200 p-4 text-center hover:border-brand-500 hover:shadow">
            <p className="text-2xl">📅</p><p className="font-semibold">Mis citas</p>
          </Link>
          <Link href="/portal/prescriptions" className="rounded-xl border border-slate-200 p-4 text-center hover:border-brand-500 hover:shadow">
            <p className="text-2xl">💊</p><p className="font-semibold">Recetas y labs</p>
          </Link>
          <Link href="/portal/messages" className="rounded-xl border border-slate-200 p-4 text-center hover:border-brand-500 hover:shadow">
            <p className="text-2xl">💬</p><p className="font-semibold">Mensajes</p>
          </Link>
        </div>
      </div>
    </PortalShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function InsuranceImg({ cardId, side, label }: { cardId: string; side: 'front' | 'back'; label: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let u = '';
    api.blobUrl(`/me/insurance/${cardId}/${side}`).then((x) => { u = x; setUrl(x); }).catch(() => {});
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [cardId, side]);
  if (!url) return <span className="text-sm text-slate-400">{label}: cargando…</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <img src={url} alt={label} className="h-28 rounded-lg border border-slate-200 object-cover" />
    </a>
  );
}
