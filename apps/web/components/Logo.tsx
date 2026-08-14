'use client';

import { useState } from 'react';

// Marca "emergemos · Medicina Integrativa".
// Usa el logo oficial en /public/logo.png si existe; si no, muestra una
// versión SVG (flor + wordmark) como respaldo.

function Flower({ size = 30 }: { size?: number }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <g transform="translate(20 20)">
        {petals.map((deg) => (
          <ellipse key={deg} cx="0" cy="-9" rx="5.2" ry="9" fill="#93285f" transform={`rotate(${deg})`} />
        ))}
        <circle cx="0" cy="0" r="6.5" fill="#ffffff" />
        {petals.map((deg) => (
          <circle key={deg} cx="0" cy="-3.4" r="1.1" fill="#e0912f" transform={`rotate(${deg})`} />
        ))}
      </g>
    </svg>
  );
}

const IMG_HEIGHT = { sm: 32, md: 44, lg: 72 };

export default function Logo({
  size = 'md',
  tagline = true,
  color = 'brand',
}: {
  size?: 'sm' | 'md' | 'lg';
  tagline?: boolean;
  color?: 'brand' | 'white';
}) {
  const [imgOk, setImgOk] = useState(true);

  // Logo oficial (si el archivo existe en /public/logo.png).
  if (imgOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.png"
        alt="emergemos · Medicina Integrativa"
        style={{ height: IMG_HEIGHT[size], width: 'auto' }}
        onError={() => setImgOk(false)}
      />
    );
  }

  // Respaldo SVG.
  const flower = size === 'lg' ? 44 : size === 'sm' ? 24 : 32;
  const word = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-xl' : 'text-2xl';
  const textColor = color === 'white' ? 'text-white' : 'text-brand-700';
  const tagColor = color === 'white' ? 'text-white/70' : 'text-brand-500';
  return (
    <div className="flex items-center gap-2">
      <Flower size={flower} />
      <div className="leading-none">
        <div className={`${word} font-light tracking-wide ${textColor}`}>emergemos</div>
        {tagline && (
          <div className={`text-[0.6rem] uppercase tracking-[0.25em] ${tagColor} mt-0.5`}>
            Medicina Integrativa
          </div>
        )}
      </div>
    </div>
  );
}
