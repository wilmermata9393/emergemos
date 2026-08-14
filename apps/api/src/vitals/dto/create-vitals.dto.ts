import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';

/// Una toma individual de presión arterial.
export class BpReadingDto {
  @IsInt()
  @Min(30)
  @Max(320)
  systolic!: number;

  @IsInt()
  @Min(20)
  @Max(220)
  diastolic!: number;
}

export class CreateVitalsDto {
  @IsOptional()
  @IsString()
  recordedAt?: string;

  // --- Presión arterial: hasta 3 tomas por brazo ---
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => BpReadingDto)
  bpRightArm?: BpReadingDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => BpReadingDto)
  bpLeftArm?: BpReadingDto[];

  // --- Pulso: hasta 3 tomas ---
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsInt({ each: true })
  @Min(20, { each: true })
  @Max(300, { each: true })
  pulse?: number[];

  // --- Peso ---
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightValue?: number;

  @IsOptional()
  @IsIn(['kg', 'lb'])
  weightUnit?: 'kg' | 'lb';

  // --- Estatura ---
  @IsOptional()
  @IsIn(['cm', 'm', 'in', 'ftin'])
  heightUnit?: 'cm' | 'm' | 'in' | 'ftin';

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightFeet?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightInches?: number;

  // --- Otros ---
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number;

  @IsOptional()
  @IsNumber()
  temperatureValue?: number;

  @IsOptional()
  @IsIn(['C', 'F'])
  temperatureUnit?: 'C' | 'F';

  @IsOptional()
  @IsString()
  fitProfile?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
