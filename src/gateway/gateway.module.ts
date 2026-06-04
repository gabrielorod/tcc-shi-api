import { Module } from '@nestjs/common';
import { HidratacaoGateway } from './hidratacao.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HidratacaoGateway],
  exports: [HidratacaoGateway],
})
export class GatewayModule {}
