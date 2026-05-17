import { IsEnum, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { Sexo } from '@prisma/client';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  pesoKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  alturaCm?: number;

  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @IsOptional()
  @IsNumber()
  @Min(1)
  metaDiariaMl?: number;
}
