import { IsUUID } from 'class-validator';

export class CreateDispositivoDto {
  @IsUUID()
  usuarioId: string;
}
