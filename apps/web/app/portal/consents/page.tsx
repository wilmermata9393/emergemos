'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PortalShell from '@/components/PortalShell';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { api } from '@/lib/api';

interface Consent {
  id: string; type: string; signedAt?: string | null; signatureName?: string | null;
  document?: { title: string; body: string } | null;
}

export default function ConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const padRef = useRef<SignaturePadHandle>(null);

  async function load() { setConsents(await api.get<Consent[]>('/me/consents')); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function open(id: string) {
    setError(''); setMsg('');
    if (openId === id) { setOpenId(null); return; }
    // Cargar el texto completo del documento.
    const full = await api.get<Consent>(`/me/consents/${id}`);
    setConsents((prev) => prev.map((c) => (c.id === id ? full : c)));
    setName('');
    setOpenId(id);
  }

  async function sign(id: string) {
    if (!name.trim()) { setError('Escribe tu nombre completo.'); return; }
    if (padRef.current?.isEmpty()) { setError('Por favor dibuja tu firma.'); return; }
    setError(''); setMsg('');
    try {
      await api.post(`/me/consents/${id}/sign`, { signatureName: name, signatureImage: padRef.current?.toDataURL() });
      setMsg('¡Consentimiento firmado! Gracias.');
      setOpenId(null);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  const pending = consents.filter((c) => !c.signedAt);
  const signed = consents.filter((c) => c.signedAt);

  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Consentimientos</h1>
      <p className="mb-6 text-lg text-slate-600">Lee y firma tus formularios. Puedes firmar con el dedo o el mouse.</p>

      <p className="mb-6 rounded-lg bg-brand-50 px-4 py-3 text-brand-800">
        ¿Primera vez? Completa tu <Link href="/portal/assessment" className="font-semibold underline">evaluación inicial</Link>.
      </p>

      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <h2 className="mb-3 text-2xl font-bold">Pendientes de firmar {pending.length > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-base text-amber-800">{pending.length}</span>}</h2>
      {pending.length === 0 && <p className="mb-6 text-slate-500">No tienes consentimientos pendientes. 🎉</p>}
      <div className="mb-8 space-y-3">
        {pending.map((c) => (
          <div key={c.id} className="card">
            <button className="flex w-full items-center justify-between text-left" onClick={() => open(c.id)}>
              <span className="text-lg font-semibold">{c.document?.title ?? c.type}</span>
              <span className="text-brand-600">{openId === c.id ? 'Cerrar' : 'Leer y firmar'}</span>
            </button>

            {openId === c.id && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mb-4 max-h-48 overflow-y-auto rounded-lg bg-slate-50 p-4 text-slate-700">
                  {c.document?.body}
                </div>
                <label className="label text-base">Escribe tu nombre completo</label>
                <input className="field mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" />
                <label className="label text-base">Tu firma</label>
                <SignaturePad ref={padRef} />
                <button className="btn-primary mt-4" onClick={() => sign(c.id)}>Firmar consentimiento</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-2xl font-bold">Firmados</h2>
      {signed.length === 0 && <p className="text-slate-500">Aún no has firmado ninguno.</p>}
      <div className="space-y-2">
        {signed.map((c) => (
          <div key={c.id} className="card flex items-center justify-between !py-3">
            <span>{c.document?.title ?? c.type}</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
              ✓ Firmado {c.signedAt ? new Date(c.signedAt).toLocaleDateString('es') : ''}
            </span>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
