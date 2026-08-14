import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class LabItemDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() code?: string;
}

export class CreateLabOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LabItemDto)
  items!: LabItemDto[];

  @IsOptional() @IsString() notes?: string;
}

export class CreateMedicationOrderDto {
  @IsString() @MinLength(1) drugName!: string;
  @IsString() @MinLength(1) dose!: string;
  @IsOptional() @IsString() route?: string;
  @IsString() @MinLength(1) frequency!: string;
  @IsOptional() @IsInt() @Min(0) durationDays?: number;
  @IsOptional() @IsString() quantity?: string;
  @IsOptional() @IsInt() @Min(0) refills?: number;
  @IsOptional() @IsString() instructions?: string;
}

export class SignMedicationDto {
  /// Contraseña del prescriptor (se re-verifica para firmar la receta).
  @IsString() @MinLength(1) password!: string;
}
