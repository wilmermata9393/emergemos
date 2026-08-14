'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRequireAuth } from '@/lib/useAuth';
import { useIdleLogout } from '@/lib/useIdleLogout';
import Logo from '@/components/Logo';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  STAFF: 'Personal',
  PROVIDER: 'Profesional',
  STUDENT: 'Estudiante',
  PATIENT: 'Paciente',
};

/// Envuelve las páginas que requieren sesión: header, navegación y logout.
const BASE_NAV = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/patients', label: 'Pacientes' },
  { href: '/schedule', label: 'Mi agenda' },
  { href: '/notifications', label: '🔔 Avisos' },
];
const ADMIN_NAV = [
  { href: '/admin/approvals', label: 'Aprobaciones' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/services', label: 'Servicios' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useRequireAuth();
  const pathname = usePathname();
  useIdleLogout();

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-slate-500">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/patients">
              <Logo size="sm" tagline={false} />
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {[...BASE_NAV, ...(user?.role === 'ADMIN' ? ADMIN_NAV : [])].map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${pathname?.startsWith(n.href) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.firstName} {user.lastName} · {ROLE_LABEL[user.role] ?? user.role}
              </span>
            )}
            <button onClick={logout} className="btn-ghost !px-4 !py-2 text-sm">
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
