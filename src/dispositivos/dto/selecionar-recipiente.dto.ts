import { IsUUID } from 'class-validator';

export class SelecionarRecipienteDto {
  @IsUUID()
  recipienteId: string;
}
