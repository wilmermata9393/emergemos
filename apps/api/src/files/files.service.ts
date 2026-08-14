import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /// Guarda un archivo: crea el registro de metadatos y escribe el contenido
  /// cifrado en disco. Devuelve el StoredFile (su id es la clave del archivo).
  async save(file: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }, uploadedById?: string) {
    const stored = await this.prisma.storedFile.create({
      data: {
        mimeType: file.mimetype,
        originalName: file.originalname,
        size: file.size,
        uploadedById,
      },
    });
    await this.storage.write(stored.id, file.buffer);
    return stored;
  }

  /// Devuelve los metadatos + el contenido descifrado.
  async get(id: string): Promise<{ meta: { mimeType: string; originalName: string }; data: Buffer }> {
    const meta = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!meta) throw new NotFoundException('Archivo no encontrado.');
    const data = await this.storage.read(id);
    return { meta, data };
  }
}
