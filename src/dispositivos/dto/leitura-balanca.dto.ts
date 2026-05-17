import { IsNumber, IsString, Min } from 'class-validator';

export class LeituraBalancaDto {
  @IsString()
  tokenAcesso: string;

  @IsNumber()
  @Min(0)
  pesoAtualG: number;
}
