'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/PortalShell';
import { api } from '@/lib/api';

interface Service { id: string; name: string; durationMin: number; priceCents?: number | null }
interface Provider { id: string; firstName: string; lastName: string; providerProfile?: { displayTitle?: string | null; discipline?: string | null } | null }
interface Appt {
  id: string; startAt: string; status: string; type: string;
  service?: { name: string } | null;
  provider: { firstName: string; lastName: string };
}
const isVideo = (t: string) => t === 'TELEHEALTH' || t === 'CLASS' || t === 'GROUP';

const STATUS: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: 'Solicitada', cls: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmada', cls: 'bg-green-100 text-green-800' },
  RESCHEDULE_REQUESTED: { label: 'Reagenda solicitada', cls: 'bg-orange-100 text-orange-800' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-slate-200 text-slate-600' },
  COMPLETED: { label: 'Realizada', cls: 'bg-slate-100 text-slate-600' },
  NO_SHOW: { label: 'No asistió', cls: 'bg-danger-100 text-danger-700' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('es', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentsPage() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [type, setType] = useState('IN_PERSON');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function loadAppts() { setAppts(await api.get<Appt[]>('/me/appointments')); }
  useEffect(() => {
    loadAppts().catch((e) => setError(e.message));
    api.get<Service[]>('/services').then(setServices).catch(() => {});
    api.get<Provider[]>('/providers').then((p) => { setProviders(p); if (p[0]) setProviderId(p[0].id); }).catch(() => {});
  }, []);

  async function loadSlots() {
    if (!providerId || !date) { setSlots([]); return; }
    setLoadingSlots(true); setError('');
    try {
      const r = await api.get<{ slots: string[] }>(`/providers/${providerId}/slots?date=${date}${serviceId ? `&serviceId=${serviceId}` : ''}`);
      setSlots(r.slots);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingSlots(false); }
  }
  useEffect(() => { loadSlots(); /* eslint-disable-next-line */ }, [providerId, date, serviceId]);

  async function book(slot: string) {
    setError(''); setMsg('');
    try {
      await api.post('/me/appointments', { providerId, serviceId: serviceId || undefined, startAt: slot, reason, type });
      setMsg('¡Cita solicitada! El equipo la confirmará pronto.');
      setReason('');
      await Promise.all([loadAppts(), loadSlots()]);
    } catch (e: any) { setError(e.message); }
  }

  async function action(id: string, path: string, ok: string) {
    setError(''); setMsg('');
    try { await api.post(`/me/appointments/${id}/${path}`, {}); setMsg(ok); await loadAppts(); }
    catch (e: any) { setError(e.message); }
  }

  const upcoming = appts.filter((a) => new Date(a.startAt) >= new Date() && a.status !== 'CANCELLED');
  const past = appts.filter((a) => !(new Date(a.startAt) >= new Date() && a.status !== 'CANCELLED'));

  return (
    <PortalShell>
      <h1 className="mb-2 text-3xl font-bold">Mis citas</h1>
      <p className="mb-6 text-lg text-slate-600">Agenda una cita nueva o revisa las que ya tienes.</p>

      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {/* Agendar */}
      <div className="card mb-8 space-y-4">
        <h2 className="text-xl font-bold">Agendar nueva cita</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label text-base">Servicio</label>
            <select className="field" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">General (30 min)</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.durationMin} min{s.priceCents ? ` · $${(s.priceCents / 100).toFixed(0)}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-base">Profesional</label>
            <select className="field" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}{p.providerProfile?.displayTitle ? ` — ${p.providerProfile.displayTitle}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-base">Modalidad</label>
            <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="IN_PERSON">Presencial</option>
              <option value="TELEHEALTH">Telemedicina (video)</option>
            </select>
          </div>
          <div>
            <label className="label text-base">Día</label>
            <input type="date" className="field" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label text-base">Motivo (opcional)</label>
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. dolor de espalda" />
          </div>
        </div>

        {date && (
          <div>
            <p className="label text-base">Horarios disponibles</p>
            {loadingSlots && <p className="text-slate-500">Buscando…</p>}
            {!loadingSlots && slots.length === 0 && <p className="text-slate-500">No hay horarios ese día. Prueba otra fecha.</p>}
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button key={s} onClick={() => book(s)} className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-base font-semibold text-brand-700 hover:bg-brand-100">
                  {new Date(s).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Próximas */}
      <h2 className="mb-3 text-2xl font-bold">Próximas citas</h2>
      {upcoming.length === 0 && <p className="text-slate-500">No tienes citas próximas.</p>}
      <div className="space-y-3">
        {upcoming.map((a) => (
          <div key={a.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-semibold capitalize">{fmt(a.startAt)}</p>
                <p className="text-slate-600">{a.service?.name ?? 'Consulta'} · con {a.provider.firstName} {a.provider.lastName}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS[a.status]?.cls}`}>{STATUS[a.status]?.label ?? a.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {isVideo(a.type) && (a.status === 'CONFIRMED' || a.status === 'REQUESTED') && (
                <a href={`/call/${a.id}`} className="btn-primary !px-4 !py-2 text-sm">🎥 Unirse a videollamada</a>
              )}
              {a.status === 'REQUESTED' && <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => action(a.id, 'confirm', 'Cita confirmada.')}>Confirmar</button>}
              {a.status !== 'RESCHEDULE_REQUESTED' && <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => action(a.id, 'request-reschedule', 'Solicitaste reagendar. El equipo te contactará.')}>Solicitar otra fecha</button>}
              <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => action(a.id, 'cancel', 'Cita cancelada.')}>Cancelar</button>
            </div>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-2xl font-bold">Anteriores</h2>
          <div className="space-y-2">
            {past.map((a) => (
              <div key={a.id} className="card flex items-center justify-between !py-3">
                <span className="capitalize">{fmt(a.startAt)} · {a.service?.name ?? 'Consulta'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[a.status]?.cls}`}>{STATUS[a.status]?.label ?? a.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </PortalShell>
  );
}
