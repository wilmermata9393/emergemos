import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  /// Contenido inicial por sección: { "seccionKey": valor }. Puede ir vacío.
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
