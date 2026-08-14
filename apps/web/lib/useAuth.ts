'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, clearSession } from './api';

export interface SessionUser {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
}

/// Protege una página: si no hay sesión, redirige al login.
export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    setUser(getUser<SessionUser>());
    setReady(true);
  }, [router]);

  const logout = () => {
    clearSession();
    router.replace('/login');
  };

  return { user, ready, logout };
}
