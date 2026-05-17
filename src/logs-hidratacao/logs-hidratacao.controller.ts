import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogHidratacao } from '@prisma/client';
import { LogsHidratacaoService } from './logs-hidratacao.service';
import { DashboardHidratacao } from './interfaces/dashboard-hidratacao.interface';

@ApiTags('logs-hidratacao')
@Controller('logs-hidratacao')
export class LogsHidratacaoController {
  constructor(private readonly logsHidratacaoService: LogsHidratacaoService) {}

  @Get('dashboard/:usuarioId')
  @ApiOperation({
    summary: 'Dashboard de hidratação',
    description: 'Retorna progresso diário, semanal e mensal com percentual da meta',
  })
  async getDashboard(@Param('usuarioId') usuarioId: string): Promise<DashboardHidratacao> {
    return this.logsHidratacaoService.getDashboard(usuarioId);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({
    summary: 'Listar logs do usuário',
    description: 'Retorna os últimos 50 registros de hidratação',
  })
  async findAll(@Param('usuarioId') usuarioId: string): Promise<LogHidratacao[]> {
    return this.logsHidratacaoService.findAll(usuarioId);
  }
}
