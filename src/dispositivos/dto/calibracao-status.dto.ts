import { IsString } from 'class-validator';

export class CalibracaoStatusDto {
  @IsString()
  tokenAcesso: string;

  @IsString()
  status: string;
}
