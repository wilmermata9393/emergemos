'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getToken, getUser, clearSession } from '@/lib/api';
import { useIdleLogout } from '@/lib/useIdleLogout';
import Logo from '@/components/Logo';
import IncomingCall from '@/components/IncomingCall';

const NAV = [
  { href: '/portal', label: 'Inicio', icon: '🏠' },
  { href: '/portal/profile', label: 'Mi perfil', icon: '👤' },
  { href: '/portal/notifications', label: 'Avisos', icon: '🔔' },
  { href: '/portal/appointments', label: 'Citas', icon: '📅' },
  { href: '/portal/prescriptions', label: 'Recetas y labs', icon: '💊' },
  { href: '/portal/consents', label: 'Consentimientos', icon: '✍️' },
  { href: '/portal/diary', label: 'Mi diario', icon: '📔' },
  { href: '/portal/documents', label: 'Documentos', icon: '📄' },
  { href: '/portal/messages', label: 'Mensajes', icon: '💬' },
  { href: '/portal/education', label: 'Educación', icon: '📚' },
];

/// Contenedor del portal del paciente. Verifica sesión y rol PATIENT.
export default function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  useIdleLogout();

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    const user = getUser<{ role: string; firstName: string }>();
    if (user?.role !== 'PATIENT') { router.replace('/patients'); return; }
    setName(user.firstName);
    setReady(true);
  }, [router]);

  if (!ready) return <main className="grid min-h-screen place-items-center"><p className="text-slate-500">Cargando…</p></main>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo size="sm" tagline={false} />
          <div className="flex items-center gap-3">
            <span className="hidden text-slate-600 sm:block">Hola, {name}</span>
            <button
              onClick={() => { clearSession(); router.replace('/login'); }}
              className="btn-ghost !px-4 !py-2 text-base"
            >
              Salir
            </button>
          </div>
        </div>
        {/* Navegación grande y accesible */}
        <nav className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-3 pb-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition ${
                  active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="text-xl">{n.icon}</span> {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      <IncomingCall />
    </div>
  );
}
