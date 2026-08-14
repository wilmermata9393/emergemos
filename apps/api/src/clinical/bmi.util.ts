// ============================================================================
//  Cálculo de BMI (Índice de Masa Corporal) y clasificación en adultos.
// ============================================================================

/// BMI = peso(kg) / estatura(m)^2. Devuelve null si faltan datos.
export function calcBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/// Clasificación de BMI en adultos (OMS/CDC).
export function adultBmiCategory(bmi: number | null): string | null {
  if (bmi == null) return null;
  if (bmi < 16) return 'Delgadez severa';
  if (bmi < 17) return 'Delgadez moderada';
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidad grado I';
  if (bmi < 40) return 'Obesidad grado II';
  return 'Obesidad grado III';
}

/// Edad en meses a partir de la fecha de nacimiento y la fecha de la toma.
export function ageInMonths(dateOfBirth: Date, at: Date = new Date()): number {
  const years = at.getFullYear() - dateOfBirth.getFullYear();
  const months = at.getMonth() - dateOfBirth.getMonth();
  const dayAdj = at.getDate() < dateOfBirth.getDate() ? -1 : 0;
  return years * 12 + months + dayAdj;
}
