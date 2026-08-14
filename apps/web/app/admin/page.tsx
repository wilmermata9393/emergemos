'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';

const SECTIONS = [
  { href: '/admin/approvals', icon: '⏳', title: 'Aprobaciones', desc: 'Pacientes que esperan aprobación' },
  { href: '/admin/users', icon: '🧑‍⚕️', title: 'Usuarios / Staff', desc: 'Crear y gestionar el equipo' },
  { href: '/admin/services', icon: '🛠️', title: 'Servicios', desc: 'Servicios y precios del booking' },
  { href: '/admin/plans', icon: '💳', title: 'Planes médicos', desc: 'Planes aceptados (para el select)' },
  { href: '/admin/lab-tests', icon: '🧪', title: 'Laboratorios', desc: 'Catálogo de pruebas de lab' },
  { href: '/admin/templates', icon: '📝', title: 'Plantillas de notas', desc: 'Crear plantillas por disciplina' },
];

export default function AdminHome() {
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
    </AppShell>
  );
}
