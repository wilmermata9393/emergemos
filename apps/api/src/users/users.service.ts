import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

const STAFF_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT, UserRole.PROVIDER];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /// Lista al equipo (no pacientes), con búsqueda opcional por nombre/teléfono/email.
  list(q?: string, role?: UserRole) {
    const where: Prisma.UserWhereInput = {
      role: role ? role : { in: STAFF_ROLES },
    };
    if (q && q.trim()) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }],
      select: {
        id: true, role: true, firstName: true, lastName: true, phone: true, email: true,
        pronoun: true, isActive: true, lastLoginAt: true, createdAt: true,
        providerProfile: { select: { discipline: true, npi: true, canPrescribe: true, displayTitle: true, bio: true, licenseNumber: true } },
      },
    });
  }

  private providerData(dto: CreateUserDto | UpdateUserDto) {
    return {
      discipline: dto.discipline,
      npi: dto.npi || null,
      hasNpi: !!dto.npi,
      canPrescribe: dto.canPrescribe ?? false,
      displayTitle: dto.displayTitle,
      bio: dto.bio,
      licenseNumber: dto.licenseNumber,
    };
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese teléfono.');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const isProfessional = dto.role === UserRole.PROVIDER || dto.role === UserRole.STUDENT;

    return this.prisma.user.create({
      data: {
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email || null,
        pronoun: dto.pronoun,
        passwordHash,
        mustChangePassword: true,
        ...(isProfessional && (dto.discipline || dto.npi)
          ? { providerProfile: { create: this.providerData(dto) as any } }
          : {}),
      },
      select: { id: true, firstName: true, lastName: true, role: true, phone: true },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { providerProfile: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const hasProviderFields =
      dto.discipline !== undefined || dto.npi !== undefined || dto.canPrescribe !== undefined ||
      dto.displayTitle !== undefined || dto.bio !== undefined || dto.licenseNumber !== undefined;

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        pronoun: dto.pronoun,
        role: dto.role,
        ...(hasProviderFields
          ? {
              providerProfile: user.providerProfile
                ? { update: this.providerData(dto) as any }
                : { create: this.providerData(dto) as any },
            }
          : {}),
      },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
  }

  async setActive(id: string, active: boolean, currentUserId: string) {
    if (id === currentUserId && !active) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta.');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return this.prisma.user.update({
      where: { id },
      data: { isActive: active },
      select: { id: true, isActive: true },
    });
  }
}
