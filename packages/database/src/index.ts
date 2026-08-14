// Punto de entrada del paquete de base de datos.
// Exporta un ÚNICO cliente Prisma para toda la aplicación (patrón singleton),
// para no abrir demasiadas conexiones en desarrollo.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-exportamos los tipos y enums generados para usarlos en toda la app.
export * from '@prisma/client';
