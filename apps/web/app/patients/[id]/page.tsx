'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import VitalsForm from '@/components/VitalsForm';
import GrowthChart, { GrowthData } from '@/components/GrowthChart';
import PatientNotes from '@/components/PatientNotes';
import PatientDemographics from '@/components/PatientDemographics';
import PatientFiles from '@/components/PatientFiles';
import StaffMessages from '@/components/StaffMessages';
import StaffOrders from '@/components/StaffOrders';
import StaffConsents from '@/components/StaffConsents';
import { api } from '@/lib/api';

interface Patient {
  id: string;
  mrn: string;
  dateOfBirth: string;
  sex: string;
  user: { firstName: string; lastName: string; phone: string; email?: string; pronoun?: string; isActive?: boolean };
}
interface PanicFlag { type: string; value: string; message: string }
interface Vitals {
  id: string;
  recordedAt: string;
  bpRightAvgSystolic?: number | null;
  bpRightAvgDiastolic?: number | null;
  bpLeftAvgSystolic?: number | null;
  bpLeftAvgDiastolic?: number | null;
  pulseAvg?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
  bmiCategory?: string | null;
  bmiPercentile?: number | null;
  oxygenSaturation?: number | null;
  temperatureC?: number | null;
  hasPanicValue: boolean;
  panicFlags?: PanicFlag[] | null;
}

function age(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, v] = await Promise.all([
        api.get<Patient>(`/patients/${id}`),
        api.get<Vitals[]>(`/patients/${id}/vitals`),
      ]);
      setPatient(p);
      setVitals(v);
      const g = await api.get<GrowthData>(`/patients/${id}/growth/bmiForAge`);
      setGrowth(g);
    } catch (err: any) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <AppShell><p className="text-danger-700">{error}</p></AppShell>;
  if (!patient) return <AppShell><p className="text-slate-500">Cargando…</p></AppShell>;

  return (
    <AppShell>
      <Link href="/patients" className="text-brand-600">← Pacientes</Link>

      <div className="card mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {patient.user.firstName} {patient.user.lastName}
            {patient.user.isActive === false && (
              <span className="ml-2 rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-600">Archivado</span>
            )}
          </h1>
          <p className="mt-1 text-slate-500">
            {patient.mrn} · {age(patient.dateOfBirth)} años · {patient.user.phone}
            {patient.user.pronoun ? ` · ${patient.user.pronoun}` : ''}
          </p>
        </div>
        <button
          className="btn-ghost !px-4 !py-2 text-sm"
          onClick={async () => {
            const activing = patient.user.isActive === false;
            if (!activing && !confirm('¿Archivar este paciente? Su cuenta se desactiva pero el récord se conserva.')) return;
            try { await api.post(`/patients/${patient.id}/active`, { active: activing }); await load(); }
            catch (e: any) { setError(e.message); }
          }}
        >
          {patient.user.isActive === false ? 'Reactivar' : 'Archivar'}
        </button>
      </div>

      <div className="mt-6">
        <PatientDemographics patient={patient} onSaved={load} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VitalsForm patientId={patient.id} onSaved={load} />

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Historial de vitales</h2>
          {vitals.length === 0 && <p className="text-slate-500">Sin registros aún.</p>}
          {vitals.map((v) => (
            <div
              key={v.id}
              className={`card ${v.hasPanicValue ? 'border-danger-600 bg-danger-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {new Date(v.recordedAt).toLocaleString('es')}
                </span>
                {v.hasPanicValue && (
                  <span className="rounded-full bg-danger-600 px-3 py-1 text-xs font-bold text-white">
                    VALOR PÁNICO
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {(v.bpRightAvgSystolic || v.bpLeftAvgSystolic) && (
                  <Metric label="Presión (D/I)" value={`${v.bpRightAvgSystolic ?? '—'}/${v.bpRightAvgDiastolic ?? '—'} · ${v.bpLeftAvgSystolic ?? '—'}/${v.bpLeftAvgDiastolic ?? '—'}`} />
                )}
                {v.pulseAvg != null && <Metric label="Pulso" value={`${v.pulseAvg}`} />}
                {v.weightKg != null && <Metric label="Peso" value={`${v.weightKg} kg`} />}
                {v.heightCm != null && <Metric label="Estatura" value={`${v.heightCm} cm`} />}
                {v.bmi != null && (
                  <Metric label="BMI" value={`${v.bmi}${v.bmiPercentile != null ? ` (P${v.bmiPercentile})` : ''}`} sub={v.bmiCategory ?? undefined} />
                )}
                {v.temperatureC != null && <Metric label="Temp." value={`${v.temperatureC} °C`} />}
                {v.oxygenSaturation != null && <Metric label="SpO₂" value={`${v.oxygenSaturation}%`} />}
              </div>
              {v.hasPanicValue && v.panicFlags && (
                <ul className="mt-3 space-y-1 text-sm text-danger-700">
                  {v.panicFlags.map((f, i) => (
                    <li key={i}>⚠️ {f.message} ({f.value})</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {growth && (
        <div className="mt-6">
          <GrowthChart data={growth} />
        </div>
      )}

      <PatientFiles patientId={patient.id} />

      <StaffOrders patientId={patient.id} />

      <StaffConsents patientId={patient.id} />

      <StaffMessages patientId={patient.id} />

      <PatientNotes patientId={patient.id} />
    </AppShell>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-semibold">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
