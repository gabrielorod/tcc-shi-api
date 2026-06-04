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
