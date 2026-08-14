'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Patient {
  id: string;
  mrn: string;
  dateOfBirth: string;
  sex: string;
  user: { firstName: string; lastName: string; phone: string; isActive?: boolean };
}

function calcAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default function PatientsPage() {
  const [q, setQ] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      setPatients(await api.get<Patient[]>(`/patients${term ? `?q=${encodeURIComponent(term)}` : ''}`));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Si llega ?q=... en la URL (ej. desde el dashboard), precarga la búsqueda.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial);
  }, []);

  // Búsqueda con pequeño retraso (debounce) mientras se escribe.
  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Link href="/patients/new" className="btn-primary">+ Nuevo paciente</Link>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative mb-6">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input
          className="field !pl-11"
          placeholder="Buscar por nombre, teléfono o número de récord (MRN)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <p className="text-slate-500">Buscando…</p>}
      {error && <p className="text-danger-700">{error}</p>}
      {!loading && patients.length === 0 && (
        <div className="card text-center text-slate-500">
          {q ? `No se encontraron pacientes para “${q}”.` : 'Aún no hay pacientes. Crea el primero.'}
        </div>
      )}

      <div className="grid gap-3">
        {patients.map((p) => (
          <Link
            key={p.id}
            href={`/patients/${p.id}`}
            className="card flex items-center justify-between transition hover:border-brand-500 hover:shadow"
          >
            <div>
              <p className="text-lg font-semibold">
                {p.user.firstName} {p.user.lastName}
                {p.user.isActive === false && (
                  <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">Archivado</span>
                )}
              </p>
              <p className="text-sm text-slate-500">{p.mrn} · {calcAge(p.dateOfBirth)} años · {p.user.phone}</p>
            </div>
            <span className="text-brand-600">Ver →</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
