'use client';

import PortalShell from '@/components/PortalShell';

// Enlaces a fuentes confiables de salud. El equipo puede ampliar esta lista.
const RESOURCES = [
  { icon: '🩺', title: 'MedlinePlus (en español)', desc: 'Información de salud confiable de la Biblioteca Nacional de Medicina de EE. UU.', url: 'https://medlineplus.gov/spanish/' },
  { icon: '🏛️', title: 'CDC — Su salud', desc: 'Centros para el Control y la Prevención de Enfermedades.', url: 'https://www.cdc.gov/spanish/' },
  { icon: '🥗', title: 'MyPlate — Alimentación', desc: 'Guía de alimentación saludable del USDA.', url: 'https://www.myplate.gov/es' },
  { icon: '❤️', title: 'Corazón e hipertensión', desc: 'American Heart Association, en español.', url: 'https://www.heart.org/en/health-topics' },
  { icon: '🧠', title: 'Salud mental', desc: 'Recursos de salud mental (MedlinePlus).', url: 'https://medlineplus.gov/spanish/mentalhealth.html' },
];

export default function EducationPage() {
  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Educación en salud</h1>
      <p className="mb-6 text-lg text-slate-600">Enlaces e información confiable para cuidar tu salud.</p>

      <div className="space-y-3">
        {RESOURCES.map((r) => (
          <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="card flex items-start gap-4 transition hover:border-brand-500 hover:shadow">
            <span className="text-4xl">{r.icon}</span>
            <div>
              <p className="text-xl font-bold text-brand-700">{r.title} ↗</p>
              <p className="text-slate-600">{r.desc}</p>
            </div>
          </a>
        ))}
      </div>

      <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500">
        Esta información es educativa y no reemplaza la consulta con tu profesional de salud.
      </p>
    </PortalShell>
  );
}
