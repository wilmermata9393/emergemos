'use client';

// Prescripción de alimentos (uso en nutrición): tabla editable con tipo de
// alimento, cantidad, comida, grupo y por cuánto tiempo.

export interface FoodRow {
  food: string;
  amount: string;
  meal: string;
  group: string;
  durationValue: string;
  durationUnit: string;
}

const MEALS = ['Desayuno', 'Merienda AM', 'Almuerzo', 'Merienda PM', 'Cena'];
const GROUPS = ['Proteínas', 'Carbohidratos', 'Vegetales', 'Frutas', 'Grasas', 'Lácteos', 'Otro'];

interface Props {
  value?: FoodRow[];
  onChange: (v: FoodRow[]) => void;
  readOnly?: boolean;
}

const emptyRow = (): FoodRow => ({ food: '', amount: '', meal: 'Desayuno', group: 'Proteínas', durationValue: '', durationUnit: 'semanas' });

export default function FoodPrescription({ value, onChange, readOnly }: Props) {
  const rows = value && value.length ? value : [emptyRow()];
  const set = (i: number, k: keyof FoodRow, val: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [k]: val } : r)));

  if (readOnly) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr><th className="p-2">Alimento</th><th className="p-2">Cantidad</th><th className="p-2">Comida</th><th className="p-2">Grupo</th><th className="p-2">Duración</th></tr>
          </thead>
          <tbody>
            {rows.filter((r) => r.food).map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-2">{r.food}</td><td className="p-2">{r.amount}</td><td className="p-2">{r.meal}</td><td className="p-2">{r.group}</td>
                <td className="p-2">{r.durationValue} {r.durationUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-6">
          <input className="field !py-1.5 text-sm sm:col-span-2" placeholder="Alimento" value={r.food} onChange={(e) => set(i, 'food', e.target.value)} />
          <input className="field !py-1.5 text-sm" placeholder="Cantidad" value={r.amount} onChange={(e) => set(i, 'amount', e.target.value)} />
          <select className="field !py-1.5 text-sm" value={r.meal} onChange={(e) => set(i, 'meal', e.target.value)}>
            {MEALS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select className="field !py-1.5 text-sm" value={r.group} onChange={(e) => set(i, 'group', e.target.value)}>
            {GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <div className="flex gap-1">
            <input className="field !py-1.5 text-sm" placeholder="#" value={r.durationValue} onChange={(e) => set(i, 'durationValue', e.target.value)} />
            <select className="field !py-1.5 text-sm" value={r.durationUnit} onChange={(e) => set(i, 'durationUnit', e.target.value)}>
              <option value="dias">días</option>
              <option value="semanas">semanas</option>
              <option value="meses">meses</option>
            </select>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className="btn-ghost !py-2 text-sm" onClick={() => onChange([...rows, emptyRow()])}>+ Agregar alimento</button>
        {rows.length > 1 && (
          <button type="button" className="btn-ghost !py-2 text-sm" onClick={() => onChange(rows.slice(0, -1))}>− Quitar último</button>
        )}
      </div>
    </div>
  );
}
