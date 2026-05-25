import { IsInt, Max, Min } from 'class-validator';

export class AtualizarConfiguracoesDto {
  @IsInt()
  @Min(15)
  @Max(120)
  gracePeriodMinutos: number;
}
