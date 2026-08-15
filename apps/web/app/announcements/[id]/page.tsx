'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import Logo from '@/components/Logo';

interface Ann { id: string; title: string; body: string; terms?: string | null; hasImage: boolean; createdAt: string }

export default function AnnouncementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ann, setAnn] = useState<Ann | null>(null);
  const [img, setImg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    api.get<Ann>(`/announcements/${id}`).then(async (a) => {
      setAnn(a);
      if (a.hasImage) { try { setImg(await api.blobUrl(`/announcements/${id}/image`)); } catch {} }
    }).catch((e) => setError(e.message));
  }, [id, router]);

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Logo size="md" tagline={false} />
          <button onClick={() => router.back()} className="btn-ghost !px-4 !py-2 text-sm">← Volver</button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {error && <p className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
        {ann && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {img && <img src={img} alt={ann.title} className="w-full object-cover" />}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-brand-800">{ann.title}</h1>
              <p className="mt-3 whitespace-pre-wrap text-lg text-slate-700">{ann.body}</p>
              {ann.terms && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Términos y condiciones</p>
                  <p className="whitespace-pre-wrap text-sm text-slate-500">{ann.terms}</p>
                </div>
              )}
              <p className="mt-6 text-xs text-slate-400">{new Date(ann.createdAt).toLocaleString('es')}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
