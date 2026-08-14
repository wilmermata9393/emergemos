'use client';

// Diagrama del cuerpo para marcar dónde duele (uso en quiropráctica).
// El usuario hace clic sobre la figura y se agrega un marcador; puede
// alternar vista frontal/posterior y anotar cada punto.

interface Marker {
  x: number; // % del ancho (0-100)
  y: number; // % del alto (0-100)
  note?: string;
}
export interface BodyMapValue {
  view: 'front' | 'back';
  markers: Marker[];
}

interface Props {
  value?: BodyMapValue;
  onChange: (v: BodyMapValue) => void;
  readOnly?: boolean;
}

export default function BodyMap({ value, onChange, readOnly }: Props) {
  const v: BodyMapValue = value ?? { view: 'front', markers: [] };

  function addMarker(e: React.MouseEvent<SVGSVGElement>) {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    onChange({ ...v, markers: [...v.markers, { x, y, note: '' }] });
  }
  function removeMarker(i: number) {
    onChange({ ...v, markers: v.markers.filter((_, j) => j !== i) });
  }
  function setNote(i: number, note: string) {
    onChange({ ...v, markers: v.markers.map((mk, j) => (j === i ? { ...mk, note } : mk)) });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        {!readOnly && (
          <div className="mb-2 flex gap-2">
            {(['front', 'back'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onChange({ ...v, view })}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                  v.view === view ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {view === 'front' ? 'Frente' : 'Espalda'}
              </button>
            ))}
          </div>
        )}
        <svg
          viewBox="0 0 200 400"
          className="w-full max-w-[220px] rounded-xl border border-slate-200 bg-slate-50"
          style={{ cursor: readOnly ? 'default' : 'crosshair' }}
          onClick={addMarker}
        >
          {/* Figura humana simplificada */}
          <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5">
            <circle cx="100" cy="40" r="26" />
            <rect x="80" y="66" width="40" height="14" rx="6" />
            <rect x="64" y="80" width="72" height="110" rx="24" />
            <rect x="40" y="86" width="24" height="100" rx="12" />
            <rect x="136" y="86" width="24" height="100" rx="12" />
            <rect x="70" y="188" width="26" height="150" rx="12" />
            <rect x="104" y="188" width="26" height="150" rx="12" />
            <rect x="70" y="330" width="30" height="18" rx="6" />
            <rect x="100" y="330" width="30" height="18" rx="6" />
          </g>
          {v.markers.map((mk, i) => (
            <g key={i}>
              <circle cx={(mk.x / 100) * 200} cy={(mk.y / 100) * 400} r="7" fill="#dc2626" stroke="#fff" strokeWidth="2" />
              <text x={(mk.x / 100) * 200} cy={(mk.y / 100) * 400} y={(mk.y / 100) * 400 + 3} fontSize="9" fill="#fff" textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <p className="mt-1 text-xs text-slate-500">
          Vista: {v.view === 'front' ? 'frente' : 'espalda'}
          {!readOnly && ' · haz clic sobre el cuerpo para marcar el dolor'}
        </p>
      </div>

      <div>
        <p className="label">Puntos marcados</p>
        {v.markers.length === 0 && <p className="text-sm text-slate-400">Ninguno aún.</p>}
        <ul className="space-y-2">
          {v.markers.map((mk, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <input
                className="field !py-1.5 text-sm"
                placeholder="Descripción (ej. lumbar, hombro…)"
                value={mk.note ?? ''}
                onChange={(e) => setNote(i, e.target.value)}
                readOnly={readOnly}
              />
              {!readOnly && (
                <button type="button" onClick={() => removeMarker(i)} className="text-danger-600" aria-label="Quitar">
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
