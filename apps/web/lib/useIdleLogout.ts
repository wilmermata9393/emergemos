'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession } from './api';

// Cierre de sesión automático por inactividad (control HIPAA).
// Tras N minutos sin actividad del usuario, cierra la sesión.
const IDLE_MINUTES = 15;

export function useIdleLogout() {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        clearSession();
        router.replace('/login');
      }, IDLE_MINUTES * 60 * 1000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [router]);
}
