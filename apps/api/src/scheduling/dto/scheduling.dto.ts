import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AppointmentType, Discipline } from '@prisma/client';

export class CreateServiceDto {
  @IsString() @MinLength(1) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(5) @Max(480) durationMin!: number;
  @IsOptional() @IsInt() @Min(0) priceCents?: number;
  @IsOptional() @IsEnum(Discipline) discipline?: Discipline;
}

export class UpdateServiceDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(5) @Max(480) durationMin?: number;
  @IsOptional() @IsInt() @Min(0) priceCents?: number;
  @IsOptional() @IsEnum(Discipline) discipline?: Discipline;
}

export class AvailabilitySlotDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek!: number;
  @IsInt() @Min(0) @Max(1440) startMinute!: number;
  @IsInt() @Min(0) @Max(1440) endMinute!: number;
}

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}

export class CreateTimeOffDto {
  @IsEnum(['VACATION', 'SICK', 'HOLIDAY', 'BREAK', 'OTHER'])
  type!: 'VACATION' | 'SICK' | 'HOLIDAY' | 'BREAK' | 'OTHER';
  @IsString() startAt!: string;
  @IsString() endAt!: string;
  @IsOptional() @IsString() note?: string;
}

export class BookAppointmentDto {
  @IsString() providerId!: string;
  @IsOptional() @IsString() serviceId?: string;
  @IsString() startAt!: string; //  ISO
  @IsOptional() @IsEnum(AppointmentType) type?: AppointmentType;
  @IsOptional() @IsString() reason?: string;
  /// Solo cuando agenda el equipo por un paciente.
  @IsOptional() @IsString() patientId?: string;
}

export class RescheduleDto {
  @IsString() startAt!: string;
}
