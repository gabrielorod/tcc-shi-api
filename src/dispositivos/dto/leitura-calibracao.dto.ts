import { IsInt, IsString, Min } from 'class-validator';

export class LeituraCalibracaoDto {
  @IsString()
  tokenAcesso: string;

  @IsInt()
  @Min(0)
  pesoVazioG: number;
}
