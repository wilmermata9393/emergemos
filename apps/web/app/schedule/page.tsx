'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { api, getUser } from '@/lib/api';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const TIMEOFF_TYPES = [
  { value: 'VACATION', label: 'Vacaciones' },
  { value: 'SICK', label: 'Enfermedad' },
  { value: 'HOLIDAY', label: 'Día de fiesta' },
  { value: 'BREAK', label: 'Break (lactancia, café, salud)' },
  { value: 'OTHER', label: 'Otro' },
];
const STATUS: Record<string, string> = {
  REQUESTED: 'Solicitada', CONFIRMED: 'Confirmada', RESCHEDULE_REQUESTED: 'Reagenda pedida',
  CANCELLED: 'Cancelada', COMPLETED: 'Realizada', NO_SHOW: 'No asistió',
};

const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

interface Row { dayOfWeek: number; start: string; end: string }
interface TimeOff { id: string; type: string; startAt: string; endAt: string; note?: string | null }
interface Appt {
  id: string; startAt: string; status: string; type: string;
  service?: { name: string } | null;
  patient: { user: { firstName: string; lastName: string; phone: string } };
  provider?: { firstName: string; lastName: string } | null;
}
const isVideo = (t: string) => t === 'TELEHEALTH' || t === 'CLASS' || t === 'GROUP';

export default function SchedulePage() {
  // El profesional gestiona SU agenda (disponibilidad, bloqueos, sus citas).
  // El admin/recepción ve la agenda de TODA la clínica.
  const role = getUser<{ role: string }>()?.role ?? '';
  const isProvider = role === 'PROVIDER';

  const [rows, setRows] = useState<Row[]>([]);
  const [timeoffs, setTimeoffs] = useState<TimeOff[]>([]);
  const [toType, setToType] = useState('VACATION');
  const [toStart, setToStart] = useState('');
  const [toEnd, setToEnd] = useState('');
  const [toNote, setToNote] = useState('');
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().slice(0, 10));
  const [apptQuery, setApptQuery] = useState('');
  const [appts, setAppts] = useState<Appt[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    if (!isProvider) return; // disponibilidad/bloqueos son solo del profesional
    const [av, to] = await Promise.all([
      api.get<{ dayOfWeek: number; startMinute: number; endMinute: number }[]>('/me/availability'),
      api.get<TimeOff[]>('/me/time-off'),
    ]);
    setRows(av.map((a) => ({ dayOfWeek: a.dayOfWeek, start: toTime(a.startMinute), end: toTime(a.endMinute) })));
    setTimeoffs(to);
  }, [isProvider]);

  const loadAgenda = useCallback(async () => {
    const from = new Date(`${agendaDate}T00:00:00`).toISOString();
    const to = new Date(`${agendaDate}T23:59:59`).toISOString();
    // Profesional: su propia agenda. Admin/recepción: toda la clínica.
    const url = isProvider ? `/me/agenda?from=${from}&to=${to}` : `/appointments?from=${from}&to=${to}`;
    setAppts(await api.get<Appt[]>(url));
  }, [agendaDate, isProvider]);

  useEffect(() => { loadAll().catch((e) => setError(e.message)); }, [loadAll]);
  useEffect(() => { loadAgenda().catch((e) => setError(e.message)); }, [loadAgenda]);

  const setRow = (i: number, k: keyof Row, v: string | number) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));

  async function saveAvailability() {
    setError(''); setMsg('');
    try {
      const slots = rows.map((r) => ({ dayOfWeek: Number(r.dayOfWeek), startMinute: toMin(r.start), endMinute: toMin(r.end) }));
      await api.put('/me/availability', { slots });
      setMsg('Disponibilidad guardada.');
      await loadAll();
    } catch (e: any) { setError(e.message); }
  }

  async function addTimeOff() {
    if (!toStart || !toEnd) { setError('Indica inicio y fin del bloqueo.'); return; }
    setError(''); setMsg('');
    try {
      await api.post('/me/time-off', { type: toType, startAt: new Date(toStart).toISOString(), endAt: new Date(toEnd).toISOString(), note: toNote });
      setToStart(''); setToEnd(''); setToNote('');
      await loadAll();
    } catch (e: any) { setError(e.message); }
  }

  async function apptAction(id: string, path: string) {
    setError('');
    try { await api.post(`/appointments/${id}/${path}`, {}); await loadAgenda(); }
    catch (e: any) { setError(e.message); }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-bold">{isProvider ? 'Mi agenda' : 'Agenda de la clínica'}</h1>
      {msg && <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">{msg}</p>}
      {error && <p className="mb-4 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}

      {/* Citas del día */}
      <div className="card mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Citas</h2>
          <input type="date" className="field !w-auto !py-2" value={agendaDate} onChange={(e) => setAgendaDate(e.target.value)} />
        </div>
        {appts.length > 0 && (
          <input className="field mb-3 !py-2" placeholder="🔍 Buscar por paciente…" value={apptQuery} onChange={(e) => setApptQuery(e.target.value)} />
        )}
        {appts.length === 0 && <p className="text-slate-500">Sin citas ese día.</p>}
        <div className="space-y-2">
          {appts.filter((a) => `${a.patient.user.firstName} ${a.patient.user.lastName}`.toLowerCase().includes(apptQuery.toLowerCase())).map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3">
              <div>
                <span className="font-semibold">{new Date(a.startAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                {' · '}{a.patient.user.firstName} {a.patient.user.lastName}
                {!isProvider && a.provider && (
                  <span className="text-brand-700"> · Dr(a). {a.provider.firstName} {a.provider.lastName}</span>
                )}
                <span className="text-slate-500"> · {a.service?.name ?? 'Consulta'} · {STATUS[a.status] ?? a.status}</span>
              </div>
              <div className="flex gap-2">
                {isVideo(a.type) && a.status !== 'CANCELLED' && <a href={`/call/${a.id}`} className="btn-primary !px-3 !py-1.5 text-sm">🎥 Unirse</a>}
                {a.status !== 'CONFIRMED' && a.status !== 'CANCELLED' && <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => apptAction(a.id, 'confirm')}>Confirmar</button>}
                {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => apptAction(a.id, 'complete')}>Realizada</button>}
                {a.status !== 'CANCELLED' && <button className="btn-ghost !px-3 !py-1.5 text-sm" onClick={() => apptAction(a.id, 'cancel')}>Cancelar</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disponibilidad y bloqueos: solo para el profesional */}
      {isProvider && (
        <>
          <div className="card mb-6">
            <h2 className="mb-3 text-xl font-bold">Disponibilidad semanal</h2>
            <p className="mb-3 text-sm text-slate-500">Las horas que definas aquí aparecen automáticamente en el Online Booking.</p>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select className="field !w-40 !py-2" value={r.dayOfWeek} onChange={(e) => setRow(i, 'dayOfWeek', Number(e.target.value))}>
                    {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
                  </select>
                  <input type="time" className="field !w-32 !py-2" value={r.start} onChange={(e) => setRow(i, 'start', e.target.value)} />
                  <span className="text-slate-400">a</span>
                  <input type="time" className="field !w-32 !py-2" value={r.end} onChange={(e) => setRow(i, 'end', e.target.value)} />
                  <button className="text-danger-600" onClick={() => setRows((rr) => rr.filter((_, j) => j !== i))} aria-label="Quitar">✕</button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost !py-2 text-sm" onClick={() => setRows((r) => [...r, { dayOfWeek: 1, start: '09:00', end: '17:00' }])}>+ Agregar franja</button>
              <button className="btn-primary !py-2 text-sm" onClick={saveAvailability}>Guardar disponibilidad</button>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-xl font-bold">Bloqueos (vacaciones, enfermedad, breaks)</h2>
            <div className="mb-4 space-y-2">
              {timeoffs.length === 0 && <p className="text-slate-500">Sin bloqueos.</p>}
              {timeoffs.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                  <span>{TIMEOFF_TYPES.find((x) => x.value === t.type)?.label ?? t.type}: {new Date(t.startAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })} → {new Date(t.endAt).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })} {t.note ? `· ${t.note}` : ''}</span>
                  <button className="text-danger-600" onClick={async () => { try { await api.del(`/me/time-off/${t.id}`); await loadAll(); } catch (e: any) { setError(e.message); } }}>Quitar</button>
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select className="field !py-2" value={toType} onChange={(e) => setToType(e.target.value)}>
                {TIMEOFF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input className="field !py-2" placeholder="Nota (opcional)" value={toNote} onChange={(e) => setToNote(e.target.value)} />
              <div><label className="label text-sm">Desde</label><input type="datetime-local" className="field !py-2" value={toStart} onChange={(e) => setToStart(e.target.value)} /></div>
              <div><label className="label text-sm">Hasta</label><input type="datetime-local" className="field !py-2" value={toEnd} onChange={(e) => setToEnd(e.target.value)} /></div>
            </div>
            <button className="btn-primary mt-3 !py-2 text-sm" onClick={addTimeOff}>Agregar bloqueo</button>
          </div>
        </>
      )}
    </AppShell>
  );
}
