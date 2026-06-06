import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class HidratacaoGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private dispositivoSockets = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.query['token'] as string | undefined;
    if (token) {
      this.dispositivoSockets.set(token, client.id);
      void this.prisma.dispositivo.updateMany({
        where: { tokenAcesso: token },
        data: { ultimoPingEm: new Date() },
      });
      console.log(`[Gateway] ESP32 conectado: ${client.id} token: ${token}`);
    }
  }

  @SubscribeMessage('registrar_dispositivo')
  handleRegistrar(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: Socket,
  ): { status: string } {
    this.dispositivoSockets.set(data.token, client.id);
    void this.prisma.dispositivo.updateMany({
      where: { tokenAcesso: data.token },
      data: { ultimoPingEm: new Date() },
    });
    console.log(`[Gateway] ESP32 registrado: token ${data.token}`);
    return { status: 'ok' };
  }

  @SubscribeMessage('registrar_leitura')
  handleRegistrarLeitura(@MessageBody() data: { tokenAcesso: string; quantidadeMl: number }): void {
    console.log(
      `[Gateway] Gole recebido via WS: ${String(data.quantidadeMl)}ml token: ${data.tokenAcesso}`,
    );

    void (async (): Promise<void> => {
      const dispositivo = await this.prisma.dispositivo.findUnique({
        where: { tokenAcesso: data.tokenAcesso },
        include: { recipienteAtivo: true },
      });

      if (!dispositivo?.usuarioAtivoId || !dispositivo.recipienteAtivo) return;

      const usuarioAtivoId = dispositivo.usuarioAtivoId;

      await this.prisma.dispositivo.update({
        where: { id: dispositivo.id },
        data: { ultimoPingEm: new Date() },
      });

      await this.prisma.logHidratacao.create({
        data: {
          usuarioId: usuarioAtivoId,
          dispositivoId: dispositivo.id,
          recipienteId: dispositivo.recipienteAtivo.id,
          quantidadeMl: data.quantidadeMl,
          pesoAntesG: 0,
          pesoDepoisG: 0,
        },
      });

      this.emitirGole(usuarioAtivoId, data.quantidadeMl);
    })();
  }

  @SubscribeMessage('ping_dispositivo')
  handlePingDispositivo(@MessageBody() data: { tokenAcesso: string }): void {
    void (async () => {
      const dispositivo = await this.prisma.dispositivo.findUnique({
        where: { tokenAcesso: data.tokenAcesso },
        include: { recipienteAtivo: true, usuarioAtivo: true },
      });

      if (!dispositivo?.usuarioAtivoId) return;

      // Atualiza o ping
      await this.prisma.dispositivo.update({
        where: { id: dispositivo.id },
        data: { ultimoPingEm: new Date() },
      });

      // Calcula consumo do dia atual
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);

      const logs = await this.prisma.logHidratacao.findMany({
        where: {
          usuarioId: dispositivo.usuarioAtivoId,
          registradoEm: { gte: inicioDia },
        },
      });

      const dailyConsumed = logs.reduce((acc, log) => acc + log.quantidadeMl, 0);

      const usuario = await this.prisma.usuario.findUnique({
        where: { id: dispositivo.usuarioAtivoId },
      });

      // Sincroniza todos os dados
      const token = data.tokenAcesso;
      this.emitirComando(token, 'set_daily_consumed', String(dailyConsumed));
      this.emitirComando(token, 'set_daily_goal', String(usuario?.metaDiariaMl ?? 2000));
      this.emitirComando(token, 'set_grace_period', String(dispositivo.gracePeriodMinutos));
      this.emitirComando(token, 'set_active_start_hour', String(dispositivo.horarioAcordar));
      this.emitirComando(token, 'set_active_end_hour', String(dispositivo.horarioDormir));

      if (dispositivo.recipienteAtivo) {
        this.emitirComando(
          token,
          'set_container_weight',
          String(dispositivo.recipienteAtivo.pesoVazioG),
        );
      }
    })();
  }

  @SubscribeMessage('peso_em_tempo_real')
  handlePesoRealTime(@MessageBody() data: { tokenAcesso: string; pesoAtual: number }): void {
    void (async (): Promise<void> => {
      const dispositivo = await this.prisma.dispositivo.findUnique({
        where: { tokenAcesso: data.tokenAcesso },
      });

      if (!dispositivo?.usuarioAtivoId) return;

      await this.prisma.dispositivo.update({
        where: { id: dispositivo.id },
        data: { pesoAtualNaMesaG: data.pesoAtual },
      });

      this.server.emit('peso_em_tempo_real', {
        usuarioId: dispositivo.usuarioAtivoId,
        pesoAtual: data.pesoAtual,
      });
    })();
  }

  @SubscribeMessage('calibracao_status')
  handleCalibracaoStatus(@MessageBody() data: { tokenAcesso: string; mensagem: string }): void {
    void (async (): Promise<void> => {
      const dispositivo = await this.prisma.dispositivo.findUnique({
        where: { tokenAcesso: data.tokenAcesso },
      });

      if (!dispositivo?.usuarioAtivoId) return;

      this.emitirStatusCalibracao(dispositivo.usuarioAtivoId, data.mensagem);
    })();
  }

  @SubscribeMessage('registrar_calibracao')
  handleRegistrarCalibracao(
    @MessageBody() data: { tokenAcesso: string; pesoVazioG: number; recipienteId: string },
  ): void {
    console.log(
      `[Gateway] Calibração recebida via WS: ${String(data.pesoVazioG)}g token: ${data.tokenAcesso}`,
    );

    void (async (): Promise<void> => {
      const dispositivo = await this.prisma.dispositivo.findUnique({
        where: { tokenAcesso: data.tokenAcesso },
      });

      if (!dispositivo) return;

      await this.prisma.recipiente.update({
        where: { id: data.recipienteId },
        data: { pesoVazioG: data.pesoVazioG },
      });

      const usuarioAtivoId = dispositivo.usuarioAtivoId;
      if (usuarioAtivoId) {
        this.emitirStatusCalibracao(
          usuarioAtivoId,
          `Calibrado! Peso vazio: ${String(data.pesoVazioG)}g`,
        );
        this.emitirStatusCalibracao(usuarioAtivoId, 'ok');
      }
    })();
  }

  @SubscribeMessage('registrar_alerta')
  handleRegistrarAlerta(@MessageBody() data: { tokenAcesso: string; mensagem: string }): void {
    console.log(`[Gateway] Alerta recebido via WS token: ${data.tokenAcesso}`);

    void (async (): Promise<void> => {
      const dispositivo = await this.prisma.dispositivo.findUnique({
        where: { tokenAcesso: data.tokenAcesso },
      });

      if (!dispositivo?.usuarioAtivoId) return;

      this.emitirAlertaHidratacao(dispositivo.usuarioAtivoId, data.mensagem);
    })();
  }

  emitirGole(usuarioId: string, quantidadeMl: number): void {
    this.server.emit('gole_registrado', { usuarioId, quantidadeMl });
  }

  emitirStatusCalibracao(usuarioId: string, status: string): void {
    this.server.emit('calibracao_status', { usuarioId, status });
  }

  emitirComando(tokenAcesso: string, comando: string, parametro?: string): void {
    const socketId = this.dispositivoSockets.get(tokenAcesso);
    if (socketId) {
      this.server.to(socketId).emit('comando', { comando, parametro });
      console.log(`[Gateway] Comando enviado ao ESP32: ${comando}`);
    } else {
      console.warn(`[Gateway] ESP32 offline para token: ${tokenAcesso}`);
    }
  }

  emitirAlertaHidratacao(usuarioId: string, mensagem: string): void {
    this.server.emit('alerta_hidratacao', { usuarioId, mensagem });
  }
}
