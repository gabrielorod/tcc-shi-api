import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum TipoComando {
  CALIBRATE = 'calibrate',
  SET_GOAL = 'set_goal',
  RESTORE = 'restore',
}

export class CriarComandoDto {
  @IsUUID()
  dispositivoId: string;

  @IsEnum(TipoComando)
  comando: TipoComando;

  @IsOptional()
  @IsString()
  parametro?: string;
}
