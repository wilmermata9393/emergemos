import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/// Información del usuario autenticado, adjuntada por la estrategia JWT.
export interface AuthenticatedUser {
  id: string;
  role: string;
  phone: string;
}

/// Permite recibir directamente al usuario logueado en un controlador:
///   metodo(@CurrentUser() user: AuthenticatedUser) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
