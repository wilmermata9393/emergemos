'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api, getUser } from '@/lib/api';

interface Patient { id: string; mrn: string; user: { firstName: string; lastName: string } }

export default function DashboardPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [unread, setUnread] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    const r = getUser<{ role: string }>()?.role ?? '';
    setRole(r);
    api.get<Patient[]>('/patients').then((p) => setPatientCount(p.length)).catch(() => {});
    api.get<{ count: number }>('/me/notifications/unread-count').then((x) => setUnread(x.count)).catch(() => {});
    if (r === 'ADMIN' || r === 'STAFF') {
      api.get<any[]>('/patients/pending').then((x) => setPending(x.length)).catch(() => {});
    }
  }, []);

  // Búsqueda rápida en vivo.
  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { setResults((await api.get<Patient[]>(`/patients?q=${encodeURIComponent(q)}`)).slice(0, 6)); } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const isAdmin = role === 'ADMIN';
  const links = [
    { href: '/patients', icon: '👥', title: 'Pacientes', desc: 'Ver y registrar pacientes' },
    { href: '/schedule', icon: '📅', title: 'Mi agenda', desc: 'Citas y disponibilidad' },
    { href: '/notifications', icon: '🔔', title: 'Notificaciones', desc: 'Avisos y recordatorios' },
    ...(isAdmin ? [
      { href: '/admin/users', icon: '🧑‍⚕️', title: 'Usuarios / Staff', desc: 'Gestionar el equipo' },
      { href: '/admin/services', icon: '🛠️', title: 'Servicios', desc: 'Servicios y precios' },
    ] : []),
  ];

  return (
    <AppShell>
      <h1 className="mb-1 text-3xl font-bold">Panel</h1>
      <p className="mb-6 text-slate-600">Resumen de la clínica y acceso rápido.</p>

      {/* Aviso de aprobaciones pendientes */}
      {pending != null && pending > 0 && (
        <Link href="/admin/approvals" className="mb-6 flex items-center justify-between rounded-2xl border border-accent-100 bg-accent-50 p-4 transition hover:shadow">
          <span className="font-semibold text-accent-700">
            ⏳ Tienes {pending} paciente(s) esperando aprobación
          </span>
          <span className="text-accent-600">Revisar →</span>
        </Link>
      )}

      {/* Búsqueda de pacientes */}
      <div className="card mb-6">
        <label className="label text-base">Buscar paciente</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            className="field !pl-11"
            placeholder="Nombre, teléfono o MRN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/patients?q=${encodeURIComponent(q)}`); }}
          />
        </div>
        {results.length > 0 && (
          <div className="mt-3 divide-y divide-slate-100">
            {results.map((p) => (
              <button key={p.id} onClick={() => router.push(`/patients/${p.id}`)} className="flex w-full items-center justify-between py-2 text-left hover:text-brand-700">
                <span>{p.user.firstName} {p.user.lastName}</span>
                <span className="text-sm text-slate-400">{p.mrn}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Métricas */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-slate-400">Pacientes</p>
          <p className="text-4xl font-bold text-brand-700">{patientCount ?? '—'}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-slate-400">Notificaciones sin leer</p>
          <p className="text-4xl font-bold text-accent-600">{unread ?? '—'}</p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="card flex items-start gap-3 transition hover:border-brand-500 hover:shadow">
            <span className="text-3xl">{l.icon}</span>
            <div>
              <p className="text-lg font-bold">{l.title}</p>
              <p className="text-sm text-slate-600">{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
