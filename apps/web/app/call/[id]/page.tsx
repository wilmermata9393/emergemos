'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { api, getToken } from '@/lib/api';
import RemoteVideo from '@/components/RemoteVideo';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const SOCKET_URL = API_URL.replace(/\/api$/, '');
const ICE = [{ urls: 'stun:stun.l.google.com:19302' }];
// NOTA producción: agregar aquí servidores TURN (o usar un proveedor con BAA)
// para que la llamada funcione detrás de firewalls/redes móviles.

interface RoomInfo {
  roomId: string;
  canJoin: boolean;
  appointment: { service?: string; provider: string; patient: string; type: string };
}

export default function CallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<RoomInfo | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Conectando…');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remotes, setRemotes] = useState<{ peerId: string; name: string; stream: MediaStream }[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const namesRef = useRef<Map<string, string>>(new Map());

  const addRemote = useCallback((peerId: string, name: string, stream: MediaStream) => {
    setRemotes((prev) => {
      const others = prev.filter((r) => r.peerId !== peerId);
      return [...others, { peerId, name, stream }];
    });
  }, []);

  const removeRemote = useCallback((peerId: string) => {
    setRemotes((prev) => prev.filter((r) => r.peerId !== peerId));
    const pc = pcsRef.current.get(peerId);
    if (pc) { pc.close(); pcsRef.current.delete(peerId); }
  }, []);

  const createPc = useCallback((peerId: string, name: string, initiator: boolean) => {
    const socket = socketRef.current!;
    const pc = new RTCPeerConnection({ iceServers: ICE });
    pcsRef.current.set(peerId, pc);
    namesRef.current.set(peerId, name);
    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    pc.onicecandidate = (e) => { if (e.candidate) socket.emit('signal', { to: peerId, data: { candidate: e.candidate } }); };
    pc.ontrack = (e) => addRemote(peerId, namesRef.current.get(peerId) ?? name, e.streams[0]);
    if (initiator) {
      pc.createOffer().then((offer) => pc.setLocalDescription(offer)).then(() => {
        socket.emit('signal', { to: peerId, data: { sdp: pc.localDescription } });
      });
    }
    return pc;
  }, [addRemote]);

  useEffect(() => {
    let socket: Socket;
    let cancelled = false;

    (async () => {
      try {
        const room = await api.get<RoomInfo>(`/telehealth/appointments/${id}/room`);
        if (cancelled) return;
        setInfo(room);
        if (!room.canJoin) { setError('No tienes permiso para entrar a esta videollamada.'); return; }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socket = io(SOCKET_URL, { auth: { token: getToken() }, transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('ready', () => { setStatus('En la sala'); socket.emit('join', { roomId: room.roomId }); });
        socket.on('unauthorized', () => setError('Sesión inválida para el video.'));
        socket.on('join-denied', () => setError('No se pudo entrar a la sala.'));

        // Soy el que llega: creo conexión (como iniciador) hacia los que ya estaban.
        socket.on('peers', ({ peers }: { peers: { peerId: string; user: { name: string } }[] }) => {
          peers.forEach((p) => createPc(p.peerId, p.user.name, true));
        });
        // Llega alguien nuevo después de mí: él iniciará; guardo su nombre.
        socket.on('peer-joined', ({ peerId, user }: { peerId: string; user: { name: string } }) => {
          namesRef.current.set(peerId, user.name);
        });
        socket.on('signal', async ({ from, data, user }: any) => {
          let pc = pcsRef.current.get(from);
          if (!pc) pc = createPc(from, user?.name ?? 'Participante', false);
          if (data.sdp) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            if (data.sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              socket.emit('signal', { to: from, data: { sdp: pc.localDescription } });
            }
          } else if (data.candidate) {
            try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
          }
        });
        socket.on('peer-left', ({ peerId }: { peerId: string }) => removeRemote(peerId));
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo acceder a la cámara/micrófono.');
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [id, createPc, removeRemote]);

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  }
  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  }
  function hangUp() {
    socketRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    router.back();
  }

  const tiles = remotes.length + 1;
  const cols = tiles <= 1 ? 'grid-cols-1' : tiles <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-semibold">Videollamada {info?.appointment.type === 'CLASS' ? '· Clase' : info?.appointment.type === 'GROUP' ? '· Grupal' : ''}</p>
          <p className="text-sm text-slate-400">{info ? `${info.appointment.provider} · ${info.appointment.patient}` : status}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{status}</span>
      </header>

      {error ? (
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <p className="text-lg text-red-300">{error}</p>
            <button onClick={() => router.back()} className="btn-ghost mt-4 !text-white">Volver</button>
          </div>
        </div>
      ) : (
        <div className={`grid flex-1 gap-3 p-4 ${cols}`}>
          <div className="relative overflow-hidden rounded-xl bg-slate-900">
            <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm">Tú {micOn ? '' : '🔇'}</span>
          </div>
          {remotes.map((r) => <RemoteVideo key={r.peerId} stream={r.stream} name={r.name} />)}
          {remotes.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-white/10 text-slate-400">
              Esperando a que se una la otra persona…
            </div>
          )}
        </div>
      )}

      {!error && (
        <footer className="flex items-center justify-center gap-4 py-5">
          <button onClick={toggleMic} className={`rounded-full px-6 py-4 text-lg font-semibold ${micOn ? 'bg-white/15' : 'bg-red-600'}`}>
            {micOn ? '🎙️ Silenciar' : '🔇 Activar'}
          </button>
          <button onClick={toggleCam} className={`rounded-full px-6 py-4 text-lg font-semibold ${camOn ? 'bg-white/15' : 'bg-red-600'}`}>
            {camOn ? '📷 Apagar' : '📷 Encender'}
          </button>
          <button onClick={hangUp} className="rounded-full bg-red-600 px-8 py-4 text-lg font-semibold hover:bg-red-700">
            📞 Colgar
          </button>
        </footer>
      )}
    </div>
  );
}
