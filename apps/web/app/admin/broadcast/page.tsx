'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

interface Service { id: string; name: string }

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [terms, setTerms] = useState('');
  const [audience, setAudience] = useState<'ALL' | 'SERVICE'>('ALL');
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { api.get<Service[]>('/services').then(setServices).catch(() => {}); }, []);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : '');
  }

  async function send() {
    setMsg(''); setError('');
    if (!title.trim() || !body.trim()) { setError('Escribe el título y el mensaje.'); return; }
    if (audience === 'SERVICE' && !serviceId) { setError('Elige el servicio para filtrar.'); return; }
    setSending(true);
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('body', body);
      if (terms.trim()) form.append('terms', terms);
      form.append('audience', audience);
      if (audience === 'SERVICE') form.append('serviceId', serviceId);
      if (image) form.append('image', image);
      const r = await api.upload<{ sent: number }>('/announcements', form);
      setMsg(`Anuncio enviado a ${r.sent} paciente(s). Aparecerá en su campana 🔔 con la imagen y los términos.`);
      setTitle(''); setBody(''); setTerms(''); setImage(null); setPreview('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-bold">📢 Anuncios y promociones</h1>
      <p className="mb-6 text-slate-600">Envía un aviso a tus pacientes con arte (imagen) y términos. Puedes mandarlo a todos o filtrar por servicio.</p>

      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      <div className="card space-y-4">
        <div>
          <label className="label">Arte / imagen (opcional)</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="block text-sm" />
          {preview && <img src={preview} alt="Vista previa" className="mt-3 max-h-60 rounded-xl border border-slate-200" />}
        </div>
        <div>
          <label className="label">Título</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. ¡Promoción de septiembre!" />
        </div>
        <div>
          <label className="label">Mensaje</label>
          <textarea className="field min-h-[100px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Ej. 20% de descuento en tu próxima consulta…" />
        </div>
        <div>
          <label className="label">Términos y condiciones (aparecen debajo de la imagen)</label>
          <textarea className="field min-h-[100px]" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Ej. Válido hasta el 30 de septiembre. No acumulable con otras ofertas…" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">¿A quién?</label>
            <select className="field" value={audience} onChange={(e) => setAudience(e.target.value as 'ALL' | 'SERVICE')}>
              <option value="ALL">Todos los pacientes</option>
              <option value="SERVICE">Solo quienes recibieron un servicio…</option>
            </select>
          </div>
          {audience === 'SERVICE' && (
            <div>
              <label className="label">Servicio</label>
              <select className="field" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">— Elige un servicio —</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={send} disabled={sending}>{sending ? 'Enviando…' : 'Enviar anuncio'}</button>
      </div>
    </AppShell>
  );
}
