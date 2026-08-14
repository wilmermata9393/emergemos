'use client';

import { useEffect, useRef } from 'react';

/// Muestra el video de un participante remoto.
export default function RemoteVideo({ stream, name }: { stream: MediaStream; name: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900">
      <video ref={ref} autoPlay playsInline className="h-full w-full object-cover" />
      <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-sm text-white">{name}</span>
    </div>
  );
}
