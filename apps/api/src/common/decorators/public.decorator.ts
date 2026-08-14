import { SetMetadata } from '@nestjs/common';

/// Marca una ruta como PÚBLICA (no requiere iniciar sesión). Ej: login.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
