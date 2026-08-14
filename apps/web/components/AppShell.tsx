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
  { href: '/admin', label: '⚙️ Administración' },
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard">
            <Logo size="sm" tagline={false} />
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.firstName} {user.lastName} · {ROLE_LABEL[user.role] ?? user.role}
              </span>
            )}
            <button onClick={logout} className="btn-ghost !px-4 !py-2 text-sm">Salir</button>
          </div>
        </div>
        {/* Navegación (siempre visible, con scroll horizontal en móvil) */}
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2">
          {[...BASE_NAV, ...(user?.role === 'ADMIN' ? ADMIN_NAV : [])].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${pathname === n.href || (n.href !== '/dashboard' && pathname?.startsWith(n.href)) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
