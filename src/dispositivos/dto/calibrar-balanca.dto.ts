import { IsInt, IsString, Min } from 'class-validator';

export class CalibrarBalancaDto {
  @IsString()
  tokenAcesso: string;

  @IsInt()
  @Min(1)
  pesoConhecidoG: number;
}
