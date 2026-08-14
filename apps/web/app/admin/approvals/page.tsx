'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Pending {
  id: string; mrn: string; dateOfBirth: string; createdAt: string;
  user: { firstName: string; lastName: string; phone: string; email?: string | null };
}

function age(dob: string) { return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)); }

export default function ApprovalsPage() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() { try { setPending(await api.get<Pending[]>('/patients/pending')); } catch (e: any) { setError(e.message); } }
  useEffect(() => { load().catch(() => {}); }, []);

  async function decide(id: string, approve: boolean, name: string) {
    if (!approve && !confirm(`¿Rechazar el registro de ${name}?`)) return;
    setError(''); setMsg('');
    try {
      await api.post(`/patients/${id}/${approve ? 'approve' : 'reject'}`, {});
      setMsg(approve ? `${name} fue aprobado y ya tiene acceso.` : `${name} fue rechazado.`);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-bold">Aprobaciones de pacientes</h1>
      <p className="mb-6 text-slate-600">Pacientes que se registraron y esperan tu aprobación para tener acceso.</p>

      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {pending.length === 0 && <div className="card text-center text-slate-500">No hay solicitudes pendientes. 🎉</div>}

      <div className="grid gap-3">
        {pending.map((p) => (
          <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{p.user.firstName} {p.user.lastName}</p>
              <p className="text-sm text-slate-500">
                {age(p.dateOfBirth)} años · {p.user.phone}{p.user.email ? ` · ${p.user.email}` : ''} · solicitó {new Date(p.createdAt).toLocaleDateString('es')}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary !px-4 !py-2 text-sm" onClick={() => decide(p.id, true, p.user.firstName)}>Aprobar</button>
              <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => decide(p.id, false, p.user.firstName)}>Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
