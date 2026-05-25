import { IsUUID } from 'class-validator';

export class UsarAgoraDto {
  @IsUUID()
  usuarioId: string;
}
