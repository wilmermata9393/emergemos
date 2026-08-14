'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/// Muestra una imagen que requiere autenticación (la descarga con el token y la
/// convierte en una URL local temporal).
export default function AuthImage({ fileId, alt, className }: { fileId: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    api
      .blobUrl(`/files/${fileId}`)
      .then((u) => {
        if (!active) { URL.revokeObjectURL(u); return; }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => setError(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (error) return <div className="grid h-32 place-items-center rounded-lg bg-slate-100 text-sm text-slate-400">No se pudo cargar</div>;
  if (!url) return <div className="grid h-32 place-items-center rounded-lg bg-slate-100 text-sm text-slate-400">Cargando…</div>;
  return <img src={url} alt={alt} className={className} />;
}
