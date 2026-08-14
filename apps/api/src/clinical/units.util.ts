// ============================================================================
//  Conversión de unidades. La base de datos guarda todo en unidades canónicas
//  (kg, cm, °C); estas funciones convierten desde/hacia lo que ve el usuario.
// ============================================================================

const round = (n: number, decimals = 2) => {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
};

// --- Peso ---
export const lbToKg = (lb: number) => round(lb * 0.45359237, 3);
export const kgToLb = (kg: number) => round(kg / 0.45359237, 1);

// --- Estatura ---
export const inToCm = (inches: number) => round(inches * 2.54, 1);
export const cmToIn = (cm: number) => round(cm / 2.54, 1);
export const mToCm = (m: number) => round(m * 100, 1);
export const cmToM = (cm: number) => round(cm / 100, 3);
export const ftInToCm = (feet: number, inches: number) => round((feet * 12 + inches) * 2.54, 1);
/// Devuelve { feet, inches } a partir de cm (para mostrar).
export const cmToFtIn = (cm: number) => {
  const totalIn = cm / 2.54;
  const feet = Math.floor(totalIn / 12);
  const inches = round(totalIn - feet * 12, 1);
  return { feet, inches };
};

// --- Temperatura ---
export const fToC = (f: number) => round(((f - 32) * 5) / 9, 1);
export const cToF = (c: number) => round((c * 9) / 5 + 32, 1);

/// Normaliza una entrada de peso a kg.
export function normalizeWeightToKg(value: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? lbToKg(value) : round(value, 3);
}

/// Normaliza una entrada de estatura a cm. Acepta cm, metros, pulgadas o pies+pulgadas.
export function normalizeHeightToCm(input: {
  unit: 'cm' | 'm' | 'in' | 'ftin';
  value?: number;
  feet?: number;
  inches?: number;
}): number {
  switch (input.unit) {
    case 'cm':
      return round(input.value ?? 0, 1);
    case 'm':
      return mToCm(input.value ?? 0);
    case 'in':
      return inToCm(input.value ?? 0);
    case 'ftin':
      return ftInToCm(input.feet ?? 0, input.inches ?? 0);
  }
}

/// Normaliza una entrada de temperatura a °C.
export function normalizeTempToC(value: number, unit: 'C' | 'F'): number {
  return unit === 'F' ? fToC(value) : round(value, 1);
}
