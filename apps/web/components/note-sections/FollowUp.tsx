'use client';

// Plan de seguimiento / próxima cita.
// El profesional puede: (1) usar el atajo "ver de nuevo en X tiempo" para
// autocompletar una fecha sugerida, y (2) fijar la FECHA Y HORA EXACTAS de la
// próxima cita con un calendario. Lo que queda guardado es la fecha/hora exacta.

export interface FollowUpValue {
  intervalValue?: string;
  intervalUnit?: 'dias' | 'semanas' | 'meses';
  /// Fecha y hora exactas de la próxima cita, formato 'YYYY-MM-DDTHH:mm'.
  scheduledAt?: string;
}

interface Props {
  value?: FollowUpValue;
  onChange: (v: FollowUpValue) => void;
  readOnly?: boolean;
}

/// Calcula una fecha/hora sugerida a partir del intervalo (hora por defecto 09:00).
export function computeFollowUpDate(v?: FollowUpValue): Date | null {
  if (!v || !v.intervalValue) return null;
  const n = Number(v.intervalValue);
  if (!n || n <= 0) return null;
  const d = new Date();
  if (v.intervalUnit === 'dias') d.setDate(d.getDate() + n);
  else if (v.intervalUnit === 'semanas') d.setDate(d.getDate() + n * 7);
  else d.setMonth(d.getMonth() + n);
  d.setHours(9, 0, 0, 0);
  return d;
}

/// Convierte un Date a string local 'YYYY-MM-DDTHH:mm' para el input.
function toLocalInput(d: Date): string {
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FollowUp({ value, onChange, readOnly }: Props) {
  const v: FollowUpValue = value ?? { intervalUnit: 'semanas' };

  function applySuggestion() {
    const d = computeFollowUpDate(v);
    if (d) onChange({ ...v, scheduledAt: toLocalInput(d) });
  }

  // Vista de solo lectura (nota firmada): mostrar la cita guardada.
  if (readOnly) {
    if (!v.scheduledAt) return <p className="text-slate-400">No se fijó próxima cita.</p>;
    const d = new Date(v.scheduledAt);
    return (
      <p className="rounded-lg bg-brand-50 px-4 py-3 text-brand-700">
        📅 Próxima cita: <strong>{d.toLocaleString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
      </p>
    );
  }

  const suggestion = computeFollowUpDate(v);

  return (
    <div className="space-y-4">
      {/* Atajo por intervalo */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-slate-600">Sugerir: ver de nuevo en</span>
        <input
          className="field !w-20 !py-2"
          inputMode="numeric"
          value={v.intervalValue ?? ''}
          onChange={(e) => onChange({ ...v, intervalValue: e.target.value })}
        />
        <select
          className="field !w-32 !py-2"
          value={v.intervalUnit ?? 'semanas'}
          onChange={(e) => onChange({ ...v, intervalUnit: e.target.value as FollowUpValue['intervalUnit'] })}
        >
          <option value="dias">días</option>
          <option value="semanas">semanas</option>
          <option value="meses">meses</option>
        </select>
        <button type="button" className="btn-ghost !px-4 !py-2 text-sm" onClick={applySuggestion} disabled={!suggestion}>
          Usar fecha sugerida
        </button>
      </div>

      {/* Fecha y hora exactas (lo que se guarda) */}
      <div>
        <label className="label">Fecha y hora exactas de la próxima cita</label>
        <input
          type="datetime-local"
          className="field sm:!w-80"
          value={v.scheduledAt ?? ''}
          min={toLocalInput(new Date())}
          onChange={(e) => onChange({ ...v, scheduledAt: e.target.value })}
        />
      </div>

      {v.scheduledAt && (
        <p className="rounded-lg bg-brand-50 px-4 py-2 text-brand-700">
          📅 Próxima cita: <strong>{new Date(v.scheduledAt).toLocaleString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
        </p>
      )}
    </div>
  );
}
