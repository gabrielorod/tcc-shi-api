import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateLembreteDto {
  @IsUUID()
  usuarioId: string;

  @IsInt()
  @Min(15) // Mínimo 15 minutos
  @Max(1440) // Máximo 24 horas
  intervaloMinutos: number;
}
