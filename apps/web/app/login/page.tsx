'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setSession } from '@/lib/api';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: { role: string } }>('/auth/login', {
        identifier,
        password,
      });
      setSession(res.accessToken, res.refreshToken, res.user);
      // Los pacientes van a su portal; el equipo, al panel clínico.
      router.replace(res.user.role === 'PATIENT' ? '/portal' : '/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Logo size="lg" />
          <p className="mt-4 text-slate-500">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5">
          <div>
            <label className="label" htmlFor="identifier">
              Teléfono o correo
            </label>
            <input
              id="identifier"
              className="field"
              placeholder="+17875551234"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-slate-500">
            ¿Eres paciente nuevo?{' '}
            <Link href="/register" className="font-semibold text-brand-700">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
