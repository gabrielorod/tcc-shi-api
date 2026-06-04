import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AtualizarConfiguracoesDto {
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  gracePeriodMinutos?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  horarioAcordar?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  horarioDormir?: number;
}
