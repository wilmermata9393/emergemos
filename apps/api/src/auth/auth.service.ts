import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditAction, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

interface RequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /// Inicia sesión con teléfono + contraseña. Registra el intento en auditoría
  /// y bloquea la cuenta temporalmente tras varios fallos.
  async login(identifier: string, password: string, info: RequestInfo) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });

    // No revelamos si el usuario existe o no (evita enumeración de cuentas).
    if (!user) {
      await this.audit.record({
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
        metadata: { identifier, reason: 'usuario_no_encontrado' },
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // ¿Cuenta bloqueada por intentos fallidos?
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Cuenta bloqueada temporalmente por seguridad. Intenta más tarde.',
      );
    }

    if (!user.isActive) {
      // Distinguir "pendiente de aprobación" de "desactivada/archivada".
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
        select: { status: true },
      });
      if (patient?.status === 'PENDING') {
        throw new ForbiddenException('Tu cuenta está pendiente de aprobación. Te avisaremos cuando esté lista.');
      }
      throw new ForbiddenException('Cuenta desactivada. Contacta a la clínica.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await this.registerFailedAttempt(user);
      await this.audit.record({
        actorId: user.id,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'User',
        entityId: user.id,
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Éxito: reiniciamos contadores y registramos el acceso.
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    await this.audit.record({
      actorId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
    });

    const tokens = await this.issueTokens(user, info);
    return {
      ...tokens,
      user: {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  private async registerFailedAttempt(user: User) {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null,
      },
    });
  }

  /// Genera el token de acceso (corto) y el de refresco (guardado con hash).
  private async issueTokens(user: User, info: RequestInfo) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, phone: user.phone },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
      },
    );

    // El token de refresco es un valor aleatorio; en la BD solo va su hash.
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const days = 7;
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  /// Renueva la sesión con rotación: valida el token de refresco, lo revoca y
  /// emite un par nuevo. Si el token es inválido/expirado/revocado, rechaza.
  async refresh(refreshToken: string, info: RequestInfo) {
    if (!refreshToken) throw new UnauthorizedException('Falta el token de refresco.');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Sesión expirada. Inicia sesión de nuevo.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('Cuenta no disponible.');

    // Rotación: revoca el token usado y emite uno nuevo.
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const tokens = await this.issueTokens(user, info);
    return {
      ...tokens,
      user: { id: user.id, role: user.role, firstName: user.firstName, lastName: user.lastName },
    };
  }

  /// Cierra sesión revocando el token de refresco.
  async logout(refreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}
