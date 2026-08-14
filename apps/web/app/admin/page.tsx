'use client';

import Link from 'next/link';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

const SECTIONS = [
  { href: '/admin/approvals', icon: '⏳', title: 'Aprobaciones', desc: 'Pacientes que esperan aprobación' },
  { href: '/admin/users', icon: '🧑‍⚕️', title: 'Usuarios / Staff', desc: 'Crear y gestionar el equipo' },
  { href: '/admin/services', icon: '🛠️', title: 'Servicios', desc: 'Servicios y precios del booking' },
  { href: '/admin/plans', icon: '💳', title: 'Planes médicos', desc: 'Planes aceptados (para el select)' },
  { href: '/admin/lab-tests', icon: '🧪', title: 'Laboratorios', desc: 'Catálogo de pruebas de lab' },
  { href: '/admin/templates', icon: '📝', title: 'Plantillas de notas', desc: 'Crear plantillas por disciplina' },
  { href: '/admin/broadcast', icon: '📢', title: 'Anuncios / promociones', desc: 'Enviar avisos a todos o por servicio' },
];

export default function AdminHome() {
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  async function runJobs() {
    setMsg(''); setError(''); setRunning(true);
    try {
      const r = await api.post<{ reminders: number; providerAgenda: number; birthdays: number }>('/notifications/run-jobs', {});
      setMsg(`Avisos generados ✓ — recordatorios: ${r.reminders}, agenda de profesionales: ${r.providerAgenda}, cumpleaños: ${r.birthdays}. Revisa la campana 🔔 de cada usuario.`);
    } catch (e: any) { setError(e.message); }
    finally { setRunning(false); }
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">Administración</h1>
      <p className="mb-6 text-slate-600">Configura los catálogos y el equipo de la clínica.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="card flex items-start gap-3 transition hover:border-brand-500 hover:shadow">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-lg font-bold">{s.title}</p>
              <p className="text-sm text-slate-600">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Avisos / notificaciones programadas */}
      <div className="card mt-6">
        <h2 className="text-lg font-bold">🔔 Avisos programados</h2>
        <p className="mt-1 text-sm text-slate-600">
          Automáticos: cada mañana la agenda del día a cada profesional, y recordatorios al paciente
          <strong> 3 días antes</strong> y <strong>1 día antes</strong> de su cita. Pulsa el botón para generarlos ahora (prueba).
        </p>
        <button className="btn-primary mt-3 !py-2 text-sm" onClick={runJobs} disabled={running}>
          {running ? 'Generando…' : 'Generar avisos ahora'}
        </button>
        {msg && <p className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{msg}</p>}
        {error && <p className="mt-3 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}
      </div>
    </AppShell>
  );
}
