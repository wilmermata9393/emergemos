import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string; //  id del usuario
  role: string;
  phone: string;
}

/// Valida el token JWT en cada petición y adjunta el usuario a la request.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'inseguro-cambiar',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Verificamos que la cuenta siga activa (pudo ser desactivada).
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Sesión inválida.');
    }
    return { id: user.id, role: user.role, phone: user.phone };
  }
}
