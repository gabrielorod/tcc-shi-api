import { Module } from '@nestjs/common';
import { LogsHidratacaoService } from './logs-hidratacao.service';
import { LogsHidratacaoController } from './logs-hidratacao.controller';

@Module({
  controllers: [LogsHidratacaoController],
  providers: [LogsHidratacaoService],
  exports: [LogsHidratacaoService],
})
export class LogsHidratacaoModule {}
