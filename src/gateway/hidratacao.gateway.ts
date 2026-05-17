import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class HidratacaoGateway {
  @WebSocketServer()
  server: Server;

  emitirGole(usuarioId: string, quantidadeMl: number): void {
    this.server.emit('gole_registrado', { usuarioId, quantidadeMl });
  }

  emitirStatusCalibracao(usuarioId: string, status: string): void {
    this.server.emit('calibracao_status', { usuarioId, status });
  }
}
