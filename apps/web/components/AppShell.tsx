'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/useAuth';
import { useIdleLogout } from '@/lib/useIdleLogout';
import Logo from '@/components/Logo';
import IncomingCall from '@/components/IncomingCall';
import NotificationWatcher from '@/components/NotificationWatcher';

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
  { href: '/messages', label: '💬 Mensajes' },
  { href: '/notifications', label: '🔔 Avisos' },
  { href: '/profile', label: '👤 Mi perfil' },
];
const ADMIN_NAV = [
  { href: '/admin', label: '⚙️ Administración' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useRequireAuth();
  const pathname = usePathname();
  useIdleLogout();

  // Contadores no leídos (los publica NotificationWatcher): avisos y mensajes.
  const [counts, setCounts] = useState<{ avisos: number; messages: number }>({ avisos: 0, messages: 0 });
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent).detail; if (d) setCounts({ avisos: d.avisos ?? 0, messages: d.messages ?? 0 }); };
    window.addEventListener('rme-unread', h);
    return () => window.removeEventListener('rme-unread', h);
  }, []);

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
        <div className="flex items-center gap-4 px-6 py-3">
          <Link href="/dashboard" className="shrink-0">
            <Logo size="lg" tagline={false} />
          </Link>
          {/* Menú centrado en el espacio disponible (con scroll en móvil) */}
          <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
            {[...BASE_NAV, ...(user?.role === 'ADMIN' ? ADMIN_NAV : [])].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative shrink-0 rounded-lg px-4 py-2.5 text-[0.95rem] font-semibold ${pathname === n.href || (n.href !== '/dashboard' && pathname?.startsWith(n.href)) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {n.label}
                {n.href === '/notifications' && counts.avisos > 0 && (
                  <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent-600 px-1.5 py-0.5 text-xs font-bold text-white">{counts.avisos}</span>
                )}
                {n.href === '/messages' && counts.messages > 0 && (
                  <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent-600 px-1.5 py-0.5 text-xs font-bold text-white">{counts.messages}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            {user && (
              <span className="hidden text-sm text-slate-500 lg:block">
                {user.firstName} {user.lastName} · {ROLE_LABEL[user.role] ?? user.role}
              </span>
            )}
            <button onClick={logout} className="btn-ghost !px-4 !py-2 text-sm">Salir</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <IncomingCall />
      <NotificationWatcher />
    </div>
  );
}
