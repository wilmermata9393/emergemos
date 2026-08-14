// ============================================================================
//  Punto de arranque de la API.
//  Aquí se activan las protecciones de seguridad a nivel de servidor.
// ============================================================================

// Cargamos las variables del .env de la raíz del monorepo ANTES de todo,
// para que la base de datos y la configuración estén disponibles al arrancar.
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cabeceras de seguridad HTTP (protege contra ataques comunes).
  app.use(helmet());

  // Solo el frontend autorizado puede llamar a la API.
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',');
  app.enableCors({ origin: origins, credentials: true });

  // Prefijo común para todas las rutas: /api/...
  app.setGlobalPrefix('api');

  // Validación automática de todos los datos que entran (rechaza lo inválido).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //            elimina campos no declarados
      forbidNonWhitelisted: true, // rechaza campos desconocidos
      transform: true, //            convierte tipos automáticamente
    }),
  );

  // En producción el hosting (Render, etc.) inyecta PORT; en local usamos API_PORT.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API escuchando en http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
