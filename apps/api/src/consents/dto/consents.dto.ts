import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class SignConsentDto {
  @IsString() @MinLength(1) signatureName!: string;
  /// Imagen de la firma manuscrita en base64 (dataURL PNG). Opcional.
  @IsOptional() @IsString() signatureImage?: string;
}

export class InitialAssessmentDto {
  @IsObject() answers!: Record<string, unknown>;
}
