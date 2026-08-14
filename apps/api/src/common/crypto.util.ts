import * as crypto from 'crypto';

// ============================================================================
//  Cifrado de campos sensibles a nivel de aplicación (AES-256-GCM).
//  Se usa para datos que se guardan en la base de datos y no deben quedar en
//  texto plano (ej. número de miembro del seguro). Reversible con la misma
//  clave (FIELD_ENCRYPTION_KEY, 32 bytes en hex).
//
//  Formato guardado: "enc:" + base64( iv(12) | authTag(16) | ciphertext )
// ============================================================================

const PREFIX = 'enc:';

function key(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY ?? '';
  return Buffer.from(hex, 'hex');
}

/// Cifra un valor. Si es null/undefined lo devuelve tal cual.
export function encryptField(value?: string | null): string | null {
  if (value == null || value === '') return value ?? null;
  const k = key();
  if (k.length !== 32) return value; // sin clave válida, no rompe (dev)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv);
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

/// Descifra un valor cifrado con encryptField. Si no tiene el prefijo (dato
/// antiguo en texto plano), lo devuelve sin cambios.
export function decryptField(value?: string | null): string | null {
  if (value == null || !value.startsWith(PREFIX)) return value ?? null;
  const k = key();
  if (k.length !== 32) return value;
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', k, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
