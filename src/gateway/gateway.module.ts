import { Module } from '@nestjs/common';
import { HidratacaoGateway } from './hidratacao.gateway';

@Module({
  providers: [HidratacaoGateway],
  exports: [HidratacaoGateway],
})
export class GatewayModule {}
