'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
  patient: any;
  onSaved: () => void;
}

export default function PatientDemographics({ patient, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    addressLine: patient.addressLine ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    zip: patient.zip ?? '',
    emergencyContactName: patient.emergencyContactName ?? '',
    emergencyContactPhone: patient.emergencyContactPhone ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setError(''); setSaving(true);
    try {
      await api.patch(`/patients/${patient.id}`, form);
      setEditing(false);
      onSaved();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!editing) {
    return (
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Demográficos y contacto</h2>
          <button className="btn-ghost !px-4 !py-2 text-sm" onClick={() => setEditing(true)}>Editar</button>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Dirección" value={[patient.addressLine, patient.city, patient.state, patient.zip].filter(Boolean).join(', ')} />
          <Info label="Contacto de emergencia" value={patient.emergencyContactName ? `${patient.emergencyContactName} · ${patient.emergencyContactPhone ?? ''}` : ''} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-xl font-bold">Editar demográficos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Dirección</label><input className="field" value={form.addressLine} onChange={(e) => set('addressLine', e.target.value)} /></div>
        <div><label className="label">Ciudad</label><input className="field" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div><label className="label">Estado</label><input className="field" value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
        <div><label className="label">Código postal</label><input className="field" value={form.zip} onChange={(e) => set('zip', e.target.value)} /></div>
        <div><label className="label">Contacto de emergencia</label><input className="field" value={form.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} /></div>
        <div><label className="label">Teléfono de emergencia</label><input className="field" value={form.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} /></div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-danger-50 px-4 py-3 text-danger-700">{error}</p>}
      <div className="mt-4 flex gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        <button className="btn-ghost" onClick={() => setEditing(false)}>Cancelar</button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium">{value || <span className="text-slate-400">—</span>}</p>
    </div>
  );
}
