import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { Sex } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  /// Teléfono en formato E.164 (ej. +17875551234). Es el usuario de acceso.
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'El teléfono debe estar en formato internacional, ej. +17875551234',
  })
  phone!: string;

  @IsOptional()
  @IsString()
  email?: string;

  /// Contraseña inicial del paciente para el portal.
  @IsString()
  @MinLength(8)
  password!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsEnum(Sex)
  sex!: Sex;

  @IsOptional()
  @IsString()
  pronoun?: string;
}
