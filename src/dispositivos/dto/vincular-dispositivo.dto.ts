import { IsString, IsUUID, MinLength } from 'class-validator';

export class VincularDispositivoDto {
  @IsString()
  @MinLength(6)
  tokenAcesso: string;

  @IsUUID()
  usuarioId: string;
}
