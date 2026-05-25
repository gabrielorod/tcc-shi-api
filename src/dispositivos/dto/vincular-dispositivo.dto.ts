import { IsString, IsUUID } from 'class-validator';

export class VincularDispositivoDto {
  @IsString()
  tokenAcesso: string;

  @IsUUID()
  usuarioId: string;
}
