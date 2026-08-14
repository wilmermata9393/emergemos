'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  patientId: string;
  onSaved: () => void;
}

type BpRow = { systolic: string; diastolic: string };
const emptyBp = (): BpRow[] => [
  { systolic: '', diastolic: '' },
  { systolic: '', diastolic: '' },
  { systolic: '', diastolic: '' },
];

export default function VitalsForm({ patientId, onSaved }: Props) {
  const [right, setRight] = useState<BpRow[]>(emptyBp());
  const [left, setLeft] = useState<BpRow[]>(emptyBp());
  const [pulse, setPulse] = useState(['', '', '']);
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('lb');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'm' | 'in' | 'ftin'>('ftin');
  const [heightValue, setHeightValue] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [temperatureValue, setTemperatureValue] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>('F');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function bpArray(rows: BpRow[]) {
    return rows
      .filter((r) => r.systolic && r.diastolic)
      .map((r) => ({ systolic: Number(r.systolic), diastolic: Number(r.diastolic) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: any = {};
      const r = bpArray(right);
      const l = bpArray(left);
      if (r.length) payload.bpRightArm = r;
      if (l.length) payload.bpLeftArm = l;
      const pulses = pulse.filter((p) => p).map(Number);
      if (pulses.length) payload.pulse = pulses;
      if (weightValue) {
        payload.weightValue = Number(weightValue);
        payload.weightUnit = weightUnit;
      }
      if (heightUnit === 'ftin') {
        if (heightFeet || heightInches) {
          payload.heightUnit = 'ftin';
          payload.heightFeet = Number(heightFeet || 0);
          payload.heightInches = Number(heightInches || 0);
        }
      } else if (heightValue) {
        payload.heightUnit = heightUnit;
        payload.heightValue = Number(heightValue);
      }
      if (temperatureValue) {
        payload.temperatureValue = Number(temperatureValue);
        payload.temperatureUnit = temperatureUnit;
      }
      if (oxygenSaturation) payload.oxygenSaturation = Number(oxygenSaturation);
      if (notes) payload.notes = notes;

      await api.post(`/patients/${patientId}/vitals`, payload);
      // Reiniciar
      setRight(emptyBp());
      setLeft(emptyBp());
      setPulse(['', '', '']);
      setWeightValue('');
      setHeightValue('');
      setHeightFeet('');
      setHeightInches('');
      setTemperatureValue('');
      setOxygenSaturation('');
      setNotes('');
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const bpBlock = (label: string, rows: BpRow[], setRows: (r: BpRow[]) => void) => (
    <div>
      <p className="label">{label} (hasta 3 tomas)</p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="field !py-2"
              placeholder="Sistólica"
              inputMode="numeric"
              value={row.systolic}
              onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, systolic: e.target.value } : r)))}
            />
            <span className="text-slate-400">/</span>
            <input
              className="field !py-2"
              placeholder="Diastólica"
              inputMode="numeric"
              value={row.diastolic}
              onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, diastolic: e.target.value } : r)))}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="card space-y-6">
      <h3 className="text-lg font-semibold">Registrar signos vitales</h3>

      <div className="grid gap-6 sm:grid-cols-2">
        {bpBlock('Presión — brazo derecho', right, setRight)}
        {bpBlock('Presión — brazo izquierdo', left, setLeft)}
      </div>

      <div>
        <p className="label">Pulso (hasta 3 tomas)</p>
        <div className="flex gap-2">
          {pulse.map((p, i) => (
            <input
              key={i}
              className="field !py-2"
              placeholder={`Toma ${i + 1}`}
              inputMode="numeric"
              value={p}
              onChange={(e) => setPulse(pulse.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="label">Peso</label>
          <div className="flex gap-2">
            <input className="field" inputMode="decimal" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} />
            <select className="field !w-28" value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as any)}>
              <option value="lb">libras</option>
              <option value="kg">kilos</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Estatura</label>
          <div className="flex gap-2">
            {heightUnit === 'ftin' ? (
              <>
                <input className="field" placeholder="pies" inputMode="numeric" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} />
                <input className="field" placeholder="pulg" inputMode="numeric" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} />
              </>
            ) : (
              <input className="field" inputMode="decimal" value={heightValue} onChange={(e) => setHeightValue(e.target.value)} />
            )}
            <select className="field !w-32" value={heightUnit} onChange={(e) => setHeightUnit(e.target.value as any)}>
              <option value="ftin">pies/pulg</option>
              <option value="cm">cm</option>
              <option value="m">metros</option>
              <option value="in">pulgadas</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Temperatura</label>
          <div className="flex gap-2">
            <input className="field" inputMode="decimal" value={temperatureValue} onChange={(e) => setTemperatureValue(e.target.value)} />
            <select className="field !w-24" value={temperatureUnit} onChange={(e) => setTemperatureUnit(e.target.value as any)}>
              <option value="F">°F</option>
              <option value="C">°C</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Saturación de oxígeno (%)</label>
          <input className="field" inputMode="numeric" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Notas (opcional)</label>
        <textarea className="field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 px-4 py-3 text-danger-700" role="alert">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar vitales'}
      </button>
    </form>
  );
}
