import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';
import { TipoRecipiente } from '@prisma/client';

export class CreateRecipienteDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsEnum(TipoRecipiente)
  tipo: TipoRecipiente;

  @IsUUID()
  usuarioId: string;
}
