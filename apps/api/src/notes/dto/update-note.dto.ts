import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsObject()
  content!: Record<string, unknown>;

  /// Motivo del cambio. OBLIGATORIO cuando la nota ya está firmada (enmienda).
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;
}
