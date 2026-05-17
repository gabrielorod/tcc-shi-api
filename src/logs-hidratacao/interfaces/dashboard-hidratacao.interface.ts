import { LogHidratacao } from '@prisma/client';

export interface ResumoHidratacao {
  totalMl: number;
  quantidadeLogs: number;
  logs: LogHidratacao[];
}

export interface DashboardHidratacao {
  meta: number;
  diario: ResumoHidratacao;
  semanal: ResumoHidratacao;
  mensal: ResumoHidratacao;
  percentualDiario: number;
}
