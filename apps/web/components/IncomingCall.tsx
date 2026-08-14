'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken, getUser } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');

interface Incoming { appointmentId: string; from: string; service: string }

/// Escucha llamadas entrantes de telemedicina y muestra un aviso con sonido.
/// Se monta en el shell del equipo y del paciente.
export default function IncomingCall() {
  const [call, setCall] = useState<Incoming | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !getToken() || !getUser()) return;
    const socket = io(SOCKET_URL, { auth: { token: getToken() }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('incoming-call', (data: Incoming) => setCall(data));
    return () => { socket.disconnect(); stopRing(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (call) startRing(); else stopRing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  function startRing() {
    stopRing();
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const beep = () => {
        // Doble tono corto tipo "ring".
        [0, 0.25].forEach((offset) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = 480;
          o.connect(g); g.connect(ctx.destination);
          const t = ctx.currentTime + offset;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
          o.start(t); o.stop(t + 0.22);
        });
      };
      beep();
      timerRef.current = setInterval(beep, 1600);
    } catch { /* el navegador puede bloquear audio sin interacción; el aviso visual igual aparece */ }
  }
  function stopRing() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (ctxRef.current) { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }
  }

  function answer() {
    const id = call!.appointmentId;
    setCall(null);
    window.location.href = `/call/${id}`;
  }

  if (!call) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 grid h-16 w-16 animate-bounce place-items-center rounded-full bg-brand-100 text-3xl">🎥</div>
        <p className="text-xl font-bold">Llamada entrante</p>
        <p className="mt-1 text-slate-600">{call.from}</p>
        <p className="text-sm text-slate-400">{call.service}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => setCall(null)} className="rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-300">Rechazar</button>
          <button onClick={answer} className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700">📞 Contestar</button>
        </div>
      </div>
    </div>
  );
}
