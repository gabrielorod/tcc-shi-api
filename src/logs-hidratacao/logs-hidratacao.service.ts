import { Injectable } from '@nestjs/common';
import { LogHidratacao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardHidratacao } from './interfaces/dashboard-hidratacao.interface';

@Injectable()
export class LogsHidratacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(usuarioId: string): Promise<DashboardHidratacao> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
    });

    const agora = new Date();

    const inicioDia = new Date(agora);
    inicioDia.setHours(0, 0, 0, 0);

    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [logsHoje, logsSemana, logsMes] = await Promise.all([
      this.prisma.logHidratacao.findMany({
        where: { usuarioId, registradoEm: { gte: inicioDia } },
        orderBy: { registradoEm: 'desc' },
      }),
      this.prisma.logHidratacao.findMany({
        where: { usuarioId, registradoEm: { gte: inicioSemana } },
        orderBy: { registradoEm: 'desc' },
      }),
      this.prisma.logHidratacao.findMany({
        where: { usuarioId, registradoEm: { gte: inicioMes } },
        orderBy: { registradoEm: 'desc' },
      }),
    ]);

    const somarMl = (logs: LogHidratacao[]): number =>
      logs.reduce((acc, log) => acc + log.quantidadeMl, 0);

    const totalDiario = somarMl(logsHoje);

    return {
      meta: usuario.metaDiariaMl,
      diario: {
        totalMl: totalDiario,
        quantidadeLogs: logsHoje.length,
        logs: logsHoje,
      },
      semanal: {
        totalMl: somarMl(logsSemana),
        quantidadeLogs: logsSemana.length,
        logs: logsSemana,
      },
      mensal: {
        totalMl: somarMl(logsMes),
        quantidadeLogs: logsMes.length,
        logs: logsMes,
      },
      percentualDiario: Math.min(Math.round((totalDiario / usuario.metaDiariaMl) * 100), 100),
    };
  }

  async findAll(usuarioId: string): Promise<LogHidratacao[]> {
    return this.prisma.logHidratacao.findMany({
      where: { usuarioId },
      orderBy: { registradoEm: 'desc' },
      take: 50, // Últimos 50 registros
    });
  }
}
