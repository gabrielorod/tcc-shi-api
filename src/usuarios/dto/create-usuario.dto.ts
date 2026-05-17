import { IsEnum, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';
import { Sexo } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(2)
  nome: string;

  @IsNumber()
  @Min(1)
  @Max(500)
  pesoKg: number;

  @IsNumber()
  @Min(30)
  @Max(300)
  alturaCm: number;

  @IsEnum(Sexo)
  sexo: Sexo;
}
