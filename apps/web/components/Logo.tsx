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

// Alto visible del logo (ya recortado) por tamaño.
const IMG_HEIGHT = { sm: 34, md: 46, lg: 72 };
// El PNG oficial es casi cuadrado con mucho espacio en blanco arriba/abajo;
// mostramos solo la franja horizontal central recortando con object-fit.
const CROP_RATIO = 4.6; // ancho : alto de la franja visible

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

  // Logo oficial horizontal (si el archivo existe en /public/logo-wide.png).
  if (imgOk) {
    const h = IMG_HEIGHT[size];
    return (
      <div style={{ height: h, width: h * CROP_RATIO, overflow: 'hidden' }} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-wide.png"
          alt="emergemos · Medicina Integrativa"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 47%' }}
          onError={() => setImgOk(false)}
        />
      </div>
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
