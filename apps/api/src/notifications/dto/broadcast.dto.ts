import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

/// Anuncio/promoción difundido a un grupo de pacientes.
export class BroadcastDto {
  @IsString() @MinLength(1) title!: string;
  @IsString() @MinLength(1) body!: string;
  /// ALL = todos los pacientes activos. SERVICE = solo quienes recibieron un servicio.
  @IsEnum(['ALL', 'SERVICE']) audience!: 'ALL' | 'SERVICE';
  @IsOptional() @IsString() serviceId?: string;
}
