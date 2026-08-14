import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Sex } from '@prisma/client';

export class UpdatePatientDto {
  // --- Campos de la cuenta (User) ---
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() pronoun?: string;
  @IsOptional() @IsString() email?: string;

  // --- Campos clínicos/demográficos (Patient) ---
  @IsOptional() @IsEnum(Sex) sex?: Sex;
  @IsOptional() @IsString() addressLine?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zip?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
}
