'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface Profile {
  mrn: string;
  user: { firstName: string; lastName: string; phone: string };
}

const CARDS = [
  { href: '/portal/appointments', icon: '📅', title: 'Mis citas', desc: 'Agenda una cita y revisa las próximas.' },
  { href: '/portal/prescriptions', icon: '💊', title: 'Recetas y labs', desc: 'Consulta tus medicamentos y órdenes de laboratorio.' },
  { href: '/portal/diary', icon: '📔', title: 'Mi diario', desc: 'Anota cómo te sientes, síntomas y medicamentos.' },
  { href: '/portal/documents', icon: '📄', title: 'Mis documentos', desc: 'Ve y sube tus laboratorios y resultados.' },
  { href: '/portal/messages', icon: '💬', title: 'Mensajes', desc: 'Escríbele a tu equipo de salud.' },
  { href: '/portal/education', icon: '📚', title: 'Educación', desc: 'Información confiable para tu salud.' },
];

export default function PortalHome() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => { api.get<Profile>('/me/profile').then(setProfile).catch(() => {}); }, []);

  return (
    <PortalShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Hola{profile ? `, ${profile.user.firstName}` : ''} 👋
        </h1>
        <p className="mt-2 text-lg text-slate-600">Bienvenido a tu portal de salud. ¿Qué deseas hacer hoy?</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="card flex items-start gap-4 transition hover:border-brand-500 hover:shadow">
            <span className="text-4xl">{c.icon}</span>
            <div>
              <p className="text-xl font-bold">{c.title}</p>
              <p className="text-slate-600">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  );
}
