import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
//  Almacenamiento de archivos CIFRADO en disco (AES-256-GCM).
//
//  - El contenido nunca se guarda en la base de datos ni en texto plano.
//  - Cada archivo en disco = IV(12) + authTag(16) + datos cifrados.
//  - La clave viene de FIELD_ENCRYPTION_KEY (.env), 32 bytes en hex.
//  - En producción, reemplazar el disco por almacenamiento de objetos con BAA
//    (ej. S3 con cifrado del lado del servidor). La interfaz no cambiaría.
// ============================================================================

const IV_LEN = 12;
const TAG_LEN = 16;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly dir: string;
  private readonly key: Buffer;

  constructor() {
    this.dir = path.resolve(
      process.env.STORAGE_DIR ?? path.join(process.cwd(), '..', '..', 'storage'),
    );
    const hex = process.env.FIELD_ENCRYPTION_KEY ?? '';
    if (hex.length !== 64) {
      this.logger.warn(
        'FIELD_ENCRYPTION_KEY no tiene 64 caracteres hex; el cifrado de archivos fallará.',
      );
    }
    this.key = Buffer.from(hex, 'hex');
  }

  private async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private filePath(key: string) {
    // Evita path traversal: solo usamos el nombre base.
    return path.join(this.dir, `${path.basename(key)}.enc`);
  }

  /// Cifra y guarda el buffer bajo la clave dada.
  async write(key: string, data: Buffer): Promise<void> {
    if (this.key.length !== 32) {
      throw new InternalServerErrorException('Clave de cifrado inválida.');
    }
    await this.ensureDir();
    const iv = crypto.randomBytes(IV_LEN);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const enc = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();
    await fs.writeFile(this.filePath(key), Buffer.concat([iv, tag, enc]));
  }

  /// Lee y descifra el archivo. Lanza si fue alterado (fallo de authTag).
  async read(key: string): Promise<Buffer> {
    const raw = await fs.readFile(this.filePath(key));
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const enc = raw.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  }

  async remove(key: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(key));
    } catch {
      // Si ya no existe, no es un error crítico.
    }
  }
}
