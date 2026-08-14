import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /// Identificador de acceso. Para pacientes es el TELÉFONO; para staff puede
  /// ser el teléfono también. (El email es opcional y no se usa para login.)
  @IsString()
  identifier!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  password!: string;
}
