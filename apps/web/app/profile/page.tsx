'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const DISCIPLINES = ['', 'INTERNAL_MEDICINE', 'NUTRITION', 'CHIROPRACTIC', 'PSYCHOLOGY', 'PSYCHIATRY', 'GYNECOLOGY', 'OTHER'];
const DISC_LABEL: Record<string, string> = {
  '': '— Sin especificar —', INTERNAL_MEDICINE: 'Medicina interna', NUTRITION: 'Nutrición', CHIROPRACTIC: 'Quiropráctica',
  PSYCHOLOGY: 'Psicología', PSYCHIATRY: 'Psiquiatría', GYNECOLOGY: 'Ginecología', OTHER: 'Otro',
};

interface Profile {
  role: string;
  firstName: string; lastName: string; phone: string; email?: string | null; pronoun?: string | null;
  providerProfile?: { discipline?: string | null; npi?: string | null; canPrescribe?: boolean; displayTitle?: string | null; bio?: string | null; licenseNumber?: string | null } | null;
}

export default function StaffProfilePage() {
  const [role, setRole] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pronoun, setPronoun] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [npi, setNpi] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [canPrescribe, setCanPrescribe] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const isProfessional = role === 'PROVIDER' || role === 'STUDENT';

  async function load() {
    try {
      const p = await api.get<Profile>('/me/staff-profile');
      setRole(p.role);
      setFirstName(p.firstName ?? ''); setLastName(p.lastName ?? '');
      setPhone(p.phone ?? ''); setEmail(p.email ?? ''); setPronoun(p.pronoun ?? '');
      setDiscipline(p.providerProfile?.discipline ?? '');
      setDisplayTitle(p.providerProfile?.displayTitle ?? '');
      setNpi(p.providerProfile?.npi ?? '');
      setLicenseNumber(p.providerProfile?.licenseNumber ?? '');
      setBio(p.providerProfile?.bio ?? '');
      setCanPrescribe(!!p.providerProfile?.canPrescribe);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setMsg(''); setError('');
    try {
      await api.patch('/me/staff-profile', {
        firstName, lastName, phone, email: email || undefined, pronoun: pronoun || undefined,
        ...(isProfessional ? {
          discipline: discipline || undefined, displayTitle: displayTitle || undefined,
          npi: npi || undefined, licenseNumber: licenseNumber || undefined, bio: bio || undefined,
        } : {}),
      });
      setMsg('Perfil actualizado.');
      await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Mi perfil</h1>
      <p className="mb-6 text-slate-600">Edita tus datos. {isProfessional && 'Lo público que ven los pacientes es tu nombre y tu especialidad.'}</p>
      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {isProfessional && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <p className="text-sm text-slate-500">Vista pública</p>
          <p className="text-lg font-bold text-brand-800">
            {firstName} {lastName}{discipline ? ` — ${DISC_LABEL[discipline]}` : ''}
          </p>
          {displayTitle && <p className="text-brand-700">{displayTitle}</p>}
        </div>
      )}

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Nombre</label><input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
          <div><label className="label">Apellido</label><input className="field" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          <div><label className="label">Teléfono</label><input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+17875551234" /></div>
          <div><label className="label">Correo</label><input className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">Pronombre</label><input className="field" value={pronoun} onChange={(e) => setPronoun(e.target.value)} placeholder="ella / él / elle" /></div>
        </div>

        {isProfessional && (
          <>
            <hr className="border-slate-100" />
            <p className="font-semibold">Datos profesionales (públicos)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Especialidad / rama</label>
                <select className="field" value={discipline} onChange={(e) => setDiscipline(e.target.value)}>
                  {DISCIPLINES.map((d) => <option key={d} value={d}>{DISC_LABEL[d]}</option>)}
                </select>
              </div>
              <div><label className="label">Título mostrado</label><input className="field" value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} placeholder="Ej. Dra. en Quiropráctica" /></div>
              <div><label className="label">NPI (si aplica)</label><input className="field" value={npi} onChange={(e) => setNpi(e.target.value)} /></div>
              <div><label className="label">Núm. de licencia</label><input className="field" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} /></div>
            </div>
            <div><label className="label">Biografía (para el Online Booking)</label><textarea className="field min-h-[100px]" value={bio} onChange={(e) => setBio(e.target.value)} /></div>
            <p className="text-sm text-slate-500">
              Permiso para recetar: <strong>{canPrescribe ? 'Sí' : 'No'}</strong> (lo gestiona el administrador).
            </p>
          </>
        )}

        <button className="btn-primary" onClick={save}>Guardar cambios</button>
      </div>
    </AppShell>
  );
}
