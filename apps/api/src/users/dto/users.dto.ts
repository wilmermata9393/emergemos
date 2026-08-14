import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Discipline, UserRole } from '@prisma/client';

// Solo roles del equipo (los pacientes se crean desde el módulo de pacientes).
const STAFF_ROLES = [UserRole.ADMIN, UserRole.STAFF, UserRole.STUDENT, UserRole.PROVIDER] as const;

export class CreateUserDto {
  @IsEnum(STAFF_ROLES as unknown as object) role!: UserRole;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'Teléfono en formato internacional, ej. +17875551234' })
  phone!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() pronoun?: string;

  // Campos de profesional (para PROVIDER / STUDENT).
  @IsOptional() @IsEnum(Discipline) discipline?: Discipline;
  @IsOptional() @IsString() npi?: string;
  @IsOptional() @IsBoolean() canPrescribe?: boolean;
  @IsOptional() @IsString() displayTitle?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() licenseNumber?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() pronoun?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;

  @IsOptional() @IsEnum(Discipline) discipline?: Discipline;
  @IsOptional() @IsString() npi?: string;
  @IsOptional() @IsBoolean() canPrescribe?: boolean;
  @IsOptional() @IsString() displayTitle?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() licenseNumber?: string;
}
