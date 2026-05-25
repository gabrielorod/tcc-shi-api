import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HidratacaoGateway } from '../gateway/hidratacao.gateway';

@Injectable()
export class HidratacaoScheduler {
  private readonly logger = new Logger(HidratacaoScheduler.name);

  // Armazena quantas vezes cada dispositivo já alertou no ciclo atual
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

  private async verificarDispositivo(dispositivoId: string): Promise<void> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id: dispositivoId },
    });

    if (!dispositivo?.usuarioAtivoId) return;

    const agora = new Date();
    const inicioJanela = new Date(agora);
    inicioJanela.setMinutes(agora.getMinutes() - dispositivo.gracePeriodMinutos);

    // Verifica se houve algum gole no período de carência
    const logRecente = await this.prisma.logHidratacao.findFirst({
      where: {
        usuarioId: dispositivo.usuarioAtivoId,
        dispositivoId: dispositivo.id,
        registradoEm: { gte: inicioJanela },
      },
    });

    if (logRecente) {
      // Usuário bebeu água no período — reseta o contador de alertas
      this.alertasDisparados.delete(dispositivoId);
      return;
    }

    const alertas = this.alertasDisparados.get(dispositivoId) ?? 0;
    const MAX_ALERTAS = 2;

    if (alertas >= MAX_ALERTAS) {
      this.logger.log(`[Scheduler] Dispositivo ${dispositivoId} atingiu limite de alertas`);
      return;
    }

    // Dispara alerta via WebSocket para o frontend
    this.gateway.emitirAlertaHidratacao(
      dispositivo.usuarioAtivoId,
      `Você não bebe água há ${String(dispositivo.gracePeriodMinutos)} minutos! Hidrate-se! 💧`,
    );

    // Envia comando ao ESP32 para acionar buzzer/LED
    this.gateway.emitirComando(dispositivo.tokenAcesso, 'alerta_hidratacao');

    this.alertasDisparados.set(dispositivoId, alertas + 1);

    this.logger.log(
      `[Scheduler] Alerta ${String(alertas + 1)}/${String(MAX_ALERTAS)} disparado para dispositivo ${dispositivoId}`,
    );
  }
}
