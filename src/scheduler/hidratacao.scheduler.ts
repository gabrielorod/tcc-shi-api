import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HidratacaoGateway } from '../gateway/hidratacao.gateway';

@Injectable()
export class HidratacaoScheduler {
  private readonly logger = new Logger(HidratacaoScheduler.name);
  private alertasDisparados = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: HidratacaoGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async verificarHidratacao(): Promise<void> {
    const dispositivos = await this.prisma.dispositivo.findMany({
      where: { usuarioAtivoId: { not: null } },
    });

    for (const dispositivo of dispositivos) {
      await this.verificarDispositivo(dispositivo.id);
    }
  }

  private estaJanelaAtiva(horarioAcordar: string, horarioDormir: string): boolean {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();

    const [hAcordar, mAcordar] = horarioAcordar.split(':').map(Number);
    const [hDormir, mDormir] = horarioDormir.split(':').map(Number);

    const minutoAcordar = hAcordar * 60 + mAcordar;
    const minutoDormir = hDormir * 60 + mDormir;

    if (minutoAcordar < minutoDormir) {
      return horaAtual >= minutoAcordar && horaAtual < minutoDormir;
    }

    return horaAtual >= minutoAcordar || horaAtual < minutoDormir;
  }

  private async verificarDispositivo(dispositivoId: string): Promise<void> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id: dispositivoId },
    });

    if (!dispositivo?.usuarioAtivoId) return;

    if (
      !this.estaJanelaAtiva(String(dispositivo.horarioAcordar), String(dispositivo.horarioDormir))
    ) {
      this.alertasDisparados.delete(dispositivoId);
      return;
    }

    const agora = new Date();
    const inicioJanela = new Date(agora);
    inicioJanela.setMinutes(agora.getMinutes() - dispositivo.gracePeriodMinutos);

    const logRecente = await this.prisma.logHidratacao.findFirst({
      where: {
        usuarioId: dispositivo.usuarioAtivoId,
        dispositivoId: dispositivo.id,
        registradoEm: { gte: inicioJanela },
      },
    });

    if (logRecente) {
      this.alertasDisparados.delete(dispositivoId);
      return;
    }

    const alertas = this.alertasDisparados.get(dispositivoId) ?? 0;
    const MAX_ALERTAS = 2;

    if (alertas >= MAX_ALERTAS) return;

    this.gateway.emitirAlertaHidratacao(
      dispositivo.usuarioAtivoId,
      `Você não bebe água há ${String(dispositivo.gracePeriodMinutos)} minutos! Hidrate-se! 💧`,
    );

    this.gateway.emitirComando(dispositivo.tokenAcesso, 'alerta_hidratacao');
    this.alertasDisparados.set(dispositivoId, alertas + 1);

    this.logger.log(
      `[Scheduler] Alerta ${String(alertas + 1)}/${String(MAX_ALERTAS)} para dispositivo ${dispositivoId}`,
    );
  }
}
