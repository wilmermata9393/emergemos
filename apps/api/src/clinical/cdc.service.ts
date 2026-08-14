// ============================================================================
//  Servicio de curvas de crecimiento del CDC (pediátrico, 2–20 años).
//
//  Usa los parámetros LMS oficiales del CDC para:
//   1) calcular el percentil y puntaje-z de un valor (BMI, peso o estatura).
//   2) generar las curvas de referencia (P3..P97) para dibujar las gráficas.
//
//  Fórmula LMS:
//    z    = ((X/M)^L - 1) / (L*S)          (L != 0)
//    X(z) = M * (1 + L*S*z)^(1/L)          (L != 0)
// ============================================================================

import { Injectable } from '@nestjs/common';
import bmiForAge from './reference/cdc-bmiForAge.json';
import weightForAge from './reference/cdc-weightForAge.json';
import statureForAge from './reference/cdc-statureForAge.json';

export type CdcMeasure = 'bmiForAge' | 'weightForAge' | 'statureForAge';
export type BiologicalSex = 'MALE' | 'FEMALE';

interface LmsPoint {
  age: number; // meses
  L: number;
  M: number;
  S: number;
}
interface LmsTable {
  sex: { '1': LmsPoint[]; '2': LmsPoint[] };
}

const TABLES: Record<CdcMeasure, LmsTable> = {
  bmiForAge: bmiForAge as unknown as LmsTable,
  weightForAge: weightForAge as unknown as LmsTable,
  statureForAge: statureForAge as unknown as LmsTable,
};

// Puntajes-z estándar de los percentiles que dibujan las curvas del CDC.
const PERCENTILE_ZS: { label: string; z: number }[] = [
  { label: 'P3', z: -1.8808 },
  { label: 'P5', z: -1.6449 },
  { label: 'P10', z: -1.2816 },
  { label: 'P25', z: -0.6745 },
  { label: 'P50', z: 0 },
  { label: 'P75', z: 0.6745 },
  { label: 'P85', z: 1.0364 },
  { label: 'P90', z: 1.2816 },
  { label: 'P95', z: 1.6449 },
  { label: 'P97', z: 1.8808 },
];

/// Función de distribución acumulada normal estándar (para z -> percentil).
function normalCdf(z: number): number {
  // Aproximación de Abramowitz & Stegun (error < 7.5e-8).
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

@Injectable()
export class CdcService {
  /// ¿Aplica la referencia pediátrica del CDC para esta edad? (2–20 años)
  isPediatricAge(ageMonths: number): boolean {
    return ageMonths >= 24 && ageMonths <= 240;
  }

  /// Interpola L, M, S a la edad exacta (en meses) entre los puntos del CDC.
  private lmsAt(measure: CdcMeasure, sex: BiologicalSex, ageMonths: number): LmsPoint | null {
    const arr = TABLES[measure].sex[sex === 'MALE' ? '1' : '2'];
    if (!arr.length) return null;
    if (ageMonths < arr[0].age || ageMonths > arr[arr.length - 1].age) return null;

    // Búsqueda del intervalo que contiene la edad.
    for (let i = 0; i < arr.length - 1; i++) {
      const a = arr[i];
      const b = arr[i + 1];
      if (ageMonths >= a.age && ageMonths <= b.age) {
        const f = (ageMonths - a.age) / (b.age - a.age);
        return {
          age: ageMonths,
          L: a.L + f * (b.L - a.L),
          M: a.M + f * (b.M - a.M),
          S: a.S + f * (b.S - a.S),
        };
      }
    }
    return arr[arr.length - 1];
  }

  private valueToZ(p: LmsPoint, x: number): number {
    if (p.L === 0) return Math.log(x / p.M) / p.S;
    return (Math.pow(x / p.M, p.L) - 1) / (p.L * p.S);
  }

  private zToValue(p: LmsPoint, z: number): number {
    if (p.L === 0) return p.M * Math.exp(p.S * z);
    return p.M * Math.pow(1 + p.L * p.S * z, 1 / p.L);
  }

  /// Percentil y puntaje-z de un valor medido. null si la edad no aplica.
  percentileFor(
    measure: CdcMeasure,
    sex: BiologicalSex,
    ageMonths: number,
    value: number,
  ): { percentile: number; zScore: number } | null {
    const p = this.lmsAt(measure, sex, ageMonths);
    if (!p || value <= 0) return null;
    const z = this.valueToZ(p, value);
    const percentile = Math.round(normalCdf(z) * 1000) / 10; // 1 decimal
    return { percentile, zScore: Math.round(z * 100) / 100 };
  }

  /// Serie de curvas de referencia (P3..P97) para dibujar la gráfica.
  /// Devuelve una fila por edad con el valor de cada percentil.
  referenceCurves(measure: CdcMeasure, sex: BiologicalSex) {
    const arr = TABLES[measure].sex[sex === 'MALE' ? '1' : '2'];
    const percentiles = PERCENTILE_ZS.map((p) => p.label);
    const rows = arr.map((point) => {
      const row: Record<string, number> = { ageMonths: point.age };
      for (const { label, z } of PERCENTILE_ZS) {
        row[label] = Math.round(this.zToValue(point, z) * 100) / 100;
      }
      return row;
    });
    return { measure, sex, percentiles, rows };
  }
}
