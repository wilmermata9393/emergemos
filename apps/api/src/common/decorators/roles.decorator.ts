import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/// Indica qué roles pueden acceder a una ruta. Ej: @Roles('ADMIN', 'STAFF')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
