import { IsNumber, Min } from 'class-validator';

export class CalibrarRecipienteDto {
  @IsNumber()
  @Min(0)
  pesoVazioG: number;
}
