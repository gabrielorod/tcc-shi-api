import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HidratacaoScheduler } from './hidratacao.scheduler';
import { GatewayModule } from '../gateway/gateway.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, GatewayModule],
  providers: [HidratacaoScheduler],
})
export class SchedulerModule {}
