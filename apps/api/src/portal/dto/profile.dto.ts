import { IsOptional, IsString, MaxLength } from 'class-validator';

/// Campos que el PACIENTE puede editar de su propio perfil.
/// (Solo teléfono, correo y dirección; el resto lo edita el equipo/admin.)
export class UpdateMyProfileDto {
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() @MaxLength(120) email?: string;
  @IsOptional() @IsString() @MaxLength(160) addressLine?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @IsString() @MaxLength(40) state?: string;
  @IsOptional() @IsString() @MaxLength(12) zip?: string;
}
