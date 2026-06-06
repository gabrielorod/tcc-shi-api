import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum TipoComando {
  CALIBRATE = 'calibrate',
  GET_CONTAINER_WEIGHT = 'get_container_weight',
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
