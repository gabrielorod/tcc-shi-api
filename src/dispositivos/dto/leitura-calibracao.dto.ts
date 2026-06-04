import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class LeituraCalibracaoDto {
  @IsString()
  tokenAcesso: string;

  @IsInt()
  @Min(0)
  pesoVazioG: number;

  @IsUUID()
  recipienteId: string;
}
