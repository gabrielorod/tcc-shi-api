import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class HidratacaoGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private dispositivoSockets = new Map<string, string>();

  handleConnection(client: Socket): void {
    const token = client.handshake.query['token'] as string | undefined;
    if (token) {
      this.dispositivoSockets.set(token, client.id);
      console.log(`[Gateway] ESP32 conectado: ${client.id} token: ${token}`);
    }
  }

  @SubscribeMessage('registrar_dispositivo')
  handleRegistrar(@MessageBody() data: { token: string }, @ConnectedSocket() client: Socket): void {
    this.dispositivoSockets.set(data.token, client.id);
    console.log(`[Gateway] ESP32 registrado: token ${data.token}`);
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
