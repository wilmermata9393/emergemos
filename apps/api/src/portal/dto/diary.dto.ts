import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiaryDto {
  /// Fecha y hora del registro (ISO). Si no se envía, se usa el momento actual.
  @IsOptional()
  @IsString()
  entryAt?: string;

  @IsOptional() @IsString() @MaxLength(2000) symptoms?: string;
  @IsOptional() @IsString() @MaxLength(2000) medications?: string;
  @IsOptional() @IsString() @MaxLength(100) mood?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
