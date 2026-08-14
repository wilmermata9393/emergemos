'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Consent {
  id: string; type: string; signedAt?: string | null; signatureName?: string | null;
  document?: { title: string } | null;
}

export default function StaffConsents({ patientId }: { patientId: string }) {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() { setConsents(await api.get<Consent[]>(`/patients/${patientId}/consents`)); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, [patientId]);

  async function assign() {
    setError(''); setMsg('');
    try {
      const r = await api.post<{ assigned: number }>(`/patients/${patientId}/consents/assign-standard`, {});
      setMsg(`Se asignaron ${r.assigned} consentimiento(s).`);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Consentimientos</h2>
        <button className="btn-ghost !px-4 !py-2 text-sm" onClick={assign}>Asignar estándar</button>
      </div>
      {msg && <p className="mb-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
      {consents.length === 0 && <p className="text-slate-500">Sin consentimientos asignados.</p>}
      <div className="space-y-2">
        {consents.map((c) => (
          <div key={c.id} className="card flex items-center justify-between !py-3">
            <span>{c.document?.title ?? c.type}</span>
            {c.signedAt ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                ✓ Firmado {new Date(c.signedAt).toLocaleDateString('es')}{c.signatureName ? ` · ${c.signatureName}` : ''}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">Pendiente</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
