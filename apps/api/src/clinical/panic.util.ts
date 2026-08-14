// ============================================================================
//  Detección de "valores pánico" (valores críticos que exigen atención).
//
//  IMPORTANTE: estos umbrales son valores por defecto razonables, NO un
//  sustituto del juicio clínico. Un profesional puede ajustarlos. Sirven para
//  resaltar en rojo y alertar al momento de documentar.
// ============================================================================

export const PANIC_THRESHOLDS = {
  // Presión arterial (mmHg)
  systolicHigh: 180, //  crisis hipertensiva
  systolicLow: 90, //    hipotensión
  diastolicHigh: 120,
  diastolicLow: 60,
  // Temperatura (°C)
  tempHighC: 40, //      hiperpirexia (~104 °F)
  tempLowC: 35, //       hipotermia (~95 °F)
  // Saturación de oxígeno (%)
  spo2Low: 90,
  // BMI en adultos
  bmiHigh: 40, //        obesidad severa
  bmiLow: 16, //         delgadez severa
  // Percentil de BMI en pediátricos
  bmiPercentileHigh: 97,
  bmiPercentileLow: 3,
} as const;

export interface PanicFlag {
  type: 'BP' | 'TEMP' | 'SPO2' | 'BMI';
  value: string;
  message: string;
}

interface PanicInput {
  bpMaxSystolic?: number | null;
  bpMaxDiastolic?: number | null;
  temperatureC?: number | null;
  oxygenSaturation?: number | null;
  bmi?: number | null;
  isPediatric?: boolean;
  bmiPercentile?: number | null;
}

/// Devuelve la lista de alertas críticas detectadas (vacía si no hay).
export function detectPanicValues(v: PanicInput): PanicFlag[] {
  const flags: PanicFlag[] = [];
  const T = PANIC_THRESHOLDS;

  if (v.bpMaxSystolic != null || v.bpMaxDiastolic != null) {
    const sys = v.bpMaxSystolic ?? 0;
    const dia = v.bpMaxDiastolic ?? 0;
    if (sys >= T.systolicHigh || dia >= T.diastolicHigh) {
      flags.push({
        type: 'BP',
        value: `${sys}/${dia} mmHg`,
        message: 'Presión arterial en rango de crisis hipertensiva.',
      });
    } else if ((v.bpMaxSystolic != null && sys <= T.systolicLow) || (v.bpMaxDiastolic != null && dia <= T.diastolicLow)) {
      flags.push({
        type: 'BP',
        value: `${sys}/${dia} mmHg`,
        message: 'Presión arterial baja (posible hipotensión).',
      });
    }
  }

  if (v.temperatureC != null) {
    if (v.temperatureC >= T.tempHighC) {
      flags.push({ type: 'TEMP', value: `${v.temperatureC} °C`, message: 'Fiebre muy alta.' });
    } else if (v.temperatureC <= T.tempLowC) {
      flags.push({ type: 'TEMP', value: `${v.temperatureC} °C`, message: 'Temperatura muy baja (hipotermia).' });
    }
  }

  if (v.oxygenSaturation != null && v.oxygenSaturation < T.spo2Low) {
    flags.push({
      type: 'SPO2',
      value: `${v.oxygenSaturation}%`,
      message: 'Saturación de oxígeno baja.',
    });
  }

  if (v.bmi != null) {
    if (v.isPediatric && v.bmiPercentile != null) {
      if (v.bmiPercentile >= T.bmiPercentileHigh) {
        flags.push({ type: 'BMI', value: `P${v.bmiPercentile}`, message: 'BMI por encima del percentil 97 (pediátrico).' });
      } else if (v.bmiPercentile <= T.bmiPercentileLow) {
        flags.push({ type: 'BMI', value: `P${v.bmiPercentile}`, message: 'BMI por debajo del percentil 3 (pediátrico).' });
      }
    } else if (!v.isPediatric) {
      if (v.bmi >= T.bmiHigh) {
        flags.push({ type: 'BMI', value: `${v.bmi}`, message: 'BMI en rango de obesidad severa.' });
      } else if (v.bmi <= T.bmiLow) {
        flags.push({ type: 'BMI', value: `${v.bmi}`, message: 'BMI en rango de delgadez severa.' });
      }
    }
  }

  return flags;
}

/// Promedio redondeado de una lista de números (o null si está vacía).
export function average(nums: number[]): number | null {
  const valid = nums.filter((n) => typeof n === 'number' && !isNaN(n));
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}
