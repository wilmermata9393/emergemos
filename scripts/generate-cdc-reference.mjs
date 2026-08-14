// ============================================================================
//  Generador de datos de referencia del CDC (curvas de crecimiento).
//  Descarga los parámetros LMS oficiales del CDC y los guarda como JSON
//  compacto para calcular percentiles pediátricos en la app.
//
//  Ejecutar una sola vez (los datos son estáticos):
//     node scripts/generate-cdc-reference.mjs
//
//  Fuente: https://www.cdc.gov/growthcharts/percentile_data_files.htm
//  Método LMS: valor -> z = ((valor/M)^L - 1) / (L*S)   (L != 0)
// ============================================================================

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../apps/api/src/clinical/reference');

const SOURCES = {
  bmiForAge: 'https://www.cdc.gov/growthcharts/data/zscore/bmiagerev.csv',
  weightForAge: 'https://www.cdc.gov/growthcharts/data/zscore/wtage.csv',
  statureForAge: 'https://www.cdc.gov/growthcharts/data/zscore/statage.csv',
};

/// Convierte el CSV del CDC en { "1": [ {age,L,M,S} ], "2": [ ... ] }.
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',').map((h) => h.trim());
  const iSex = header.indexOf('Sex');
  const iAge = header.indexOf('Agemos');
  const iL = header.indexOf('L');
  const iM = header.indexOf('M');
  const iS = header.indexOf('S');

  const bySex = { 1: [], 2: [] };
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const c = lines[i].split(',');
    const sex = c[iSex].trim();
    if (sex !== '1' && sex !== '2') continue;
    bySex[sex].push({
      age: Number(c[iAge]),
      L: Number(c[iL]),
      M: Number(c[iM]),
      S: Number(c[iS]),
    });
  }
  for (const s of ['1', '2']) bySex[s].sort((a, b) => a.age - b.age);
  return bySex;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const [name, url] of Object.entries(SOURCES)) {
    process.stdout.write(`Descargando ${name}... `);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`);
    const csv = await res.text();
    const data = parseCsv(csv);
    const out = resolve(OUT_DIR, `cdc-${name}.json`);
    await writeFile(
      out,
      JSON.stringify(
        {
          source: url,
          measure: name,
          note: 'Parámetros LMS del CDC. Sexo: 1=masculino, 2=femenino. age en meses.',
          sex: data,
        },
        null,
        0,
      ),
    );
    console.log(`OK (M:${data['1'].length} F:${data['2'].length} puntos) -> ${out}`);
  }
  console.log('Listo.');
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
