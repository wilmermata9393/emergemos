'use client';

interface Row {
  ageMonths: number;
  [key: string]: number;
}
export interface GrowthData {
  applicable: boolean;
  reason?: string;
  measure?: string;
  sex?: string;
  reference?: { percentiles: string[]; rows: Row[] };
  points?: { ageMonths: number; value: number; percentile: number | null }[];
}

const MEASURE_LABEL: Record<string, { title: string; y: string; yMin: number; yMax: number; step: number }> = {
  bmiForAge: { title: 'BMI para la edad', y: 'BMI (kg/m²)', yMin: 12, yMax: 36, step: 4 },
  weightForAge: { title: 'Peso para la edad', y: 'Peso (kg)', yMin: 10, yMax: 110, step: 20 },
  statureForAge: { title: 'Estatura para la edad', y: 'Estatura (cm)', yMin: 80, yMax: 200, step: 20 },
};

const EMPHASIZE: Record<string, string> = { P50: '#0f766e', P85: '#d97706', P95: '#dc2626' };

export default function GrowthChart({ data }: { data: GrowthData }) {
  if (!data.applicable || !data.reference) {
    return (
      <div className="card text-slate-500">
        {data.reason ?? 'No hay curvas de crecimiento disponibles para este paciente.'}
      </div>
    );
  }

  const cfg = MEASURE_LABEL[data.measure ?? 'bmiForAge'];
  const W = 720, H = 480, m = { t: 30, r: 60, b: 45, l: 45 };
  const plotW = W - m.l - m.r, plotH = H - m.t - m.b;
  const xMin = 24, xMax = 240;
  const xs = (age: number) => m.l + ((age - xMin) / (xMax - xMin)) * plotW;
  const ys = (v: number) => m.t + (1 - (v - cfg.yMin) / (cfg.yMax - cfg.yMin)) * plotH;

  const rows = data.reference.rows.filter((r) => r.ageMonths >= xMin && r.ageMonths <= xMax);
  const last = rows[rows.length - 1];

  return (
    <div className="card overflow-x-auto">
      <h3 className="mb-3 text-lg font-semibold">{cfg.title} — curvas del CDC</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 520 }} fontFamily="inherit">
        {/* Rejilla X (años) */}
        {Array.from({ length: 10 }, (_, i) => 24 + i * 24).map((age) => (
          <g key={`x${age}`}>
            <line x1={xs(age)} y1={m.t} x2={xs(age)} y2={m.t + plotH} stroke="#eef2f7" />
            <text x={xs(age)} y={m.t + plotH + 18} fontSize="10" fill="#64748b" textAnchor="middle">
              {age / 12}a
            </text>
          </g>
        ))}
        {/* Rejilla Y */}
        {Array.from({ length: Math.floor((cfg.yMax - cfg.yMin) / cfg.step) + 1 }, (_, i) => cfg.yMin + i * cfg.step).map((v) => (
          <g key={`y${v}`}>
            <line x1={m.l} y1={ys(v)} x2={m.l + plotW} y2={ys(v)} stroke="#eef2f7" />
            <text x={m.l - 8} y={ys(v) + 3} fontSize="10" fill="#64748b" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {/* Curvas de percentiles */}
        {data.reference.percentiles.map((p) => {
          const d = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${xs(r.ageMonths).toFixed(1)},${ys(r[p]).toFixed(1)}`).join(' ');
          const color = EMPHASIZE[p] ?? '#cbd5e1';
          return (
            <g key={p}>
              <path d={d} fill="none" stroke={color} strokeWidth={EMPHASIZE[p] ? 2 : 1} />
              <text x={xs(last.ageMonths) + 3} y={ys(last[p]) + 3} fontSize="9" fill={color}>
                {p}
              </text>
            </g>
          );
        })}
        {/* Puntos del paciente */}
        {(data.points ?? []).map((pt, i) => (
          <g key={i}>
            <circle cx={xs(pt.ageMonths)} cy={ys(pt.value)} r={6} fill="#2563eb" stroke="#fff" strokeWidth={2} />
            <text x={xs(pt.ageMonths)} y={ys(pt.value) - 12} fontSize="11" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">
              {pt.value}{pt.percentile != null ? ` · P${pt.percentile}` : ''}
            </text>
          </g>
        ))}
        <text x={m.l + plotW / 2} y={H - 6} fontSize="11" fill="#475569" textAnchor="middle">
          Edad (años)
        </text>
      </svg>
      <p className="mt-2 text-sm text-slate-500">
        Líneas grises: percentiles del CDC. Verde P50 · naranja P85 · rojo P95. Punto azul: medición del paciente.
      </p>
    </div>
  );
}
