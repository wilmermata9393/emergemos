'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser } from '@/lib/api';

// Redirige según haya sesión y rol.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    const user = getUser<{ role: string }>();
    router.replace(user?.role === 'PATIENT' ? '/portal' : '/dashboard');
  }, [router]);
  return (
    <main className="grid min-h-screen place-items-center">
      <p className="text-slate-500">Cargando…</p>
    </main>
  );
}
