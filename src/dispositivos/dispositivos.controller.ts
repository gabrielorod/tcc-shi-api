import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Dispositivo } from '@prisma/client';
import { DispositivosService } from './dispositivos.service';
import { SelecionarRecipienteDto } from './dto/selecionar-recipiente.dto';
import { LeituraBalancaDto } from './dto/leitura-balanca.dto';
import { CriarComandoDto } from './dto/criar-comando.dto';
import { CalibracaoStatusDto } from './dto/calibracao-status.dto';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { UsarAgoraDto } from './dto/usar-agora.dto';
import { AtualizarConfiguracoesDto } from './dto/atualizar-configuracoes.dto';
import { LeituraCalibracaoDto } from './dto/leitura-calibracao.dto';

@ApiTags('dispositivos')
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly dispositivosService: DispositivosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo dispositivo com token gerado automaticamente' })
  async create(): Promise<Dispositivo> {
    return this.dispositivosService.create();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar dispositivo por ID' })
  async findOne(@Param('id') id: string): Promise<Dispositivo> {
    return this.dispositivosService.findOne(id);
  }

  @Post('vincular')
  @ApiOperation({ summary: 'Vincular dispositivo pelo token — usuário digita o token no app' })
  async vincular(@Body() dto: VincularDispositivoDto): Promise<Dispositivo> {
    return this.dispositivosService.vincular(dto);
  }

  @Patch(':id/usar-agora')
  @ApiOperation({ summary: 'Trocar usuário ativo no dispositivo' })
  async usarAgora(@Param('id') id: string, @Body() dto: UsarAgoraDto): Promise<Dispositivo> {
    return this.dispositivosService.usarAgora(id, dto);
  }

  @Patch(':id/recipiente')
  @ApiOperation({ summary: 'Selecionar recipiente ativo' })
  async selecionarRecipiente(
    @Param('id') id: string,
    @Body() dto: SelecionarRecipienteDto,
  ): Promise<Dispositivo> {
    return this.dispositivosService.selecionarRecipiente(id, dto);
  }

  @Patch(':id/configuracoes')
  @ApiOperation({ summary: 'Atualizar Grace Period do dispositivo' })
  async atualizarConfiguracoes(
    @Param('id') id: string,
    @Body() dto: AtualizarConfiguracoesDto,
  ): Promise<Dispositivo> {
    return this.dispositivosService.atualizarConfiguracoes(id, dto);
  }

  @Post('leitura')
  @ApiOperation({ summary: 'Receber leitura de gole do ESP32' })
  async processarLeitura(
    @Body() dto: LeituraBalancaDto,
  ): Promise<{ evento: string; quantidadeMl?: number }> {
    return this.dispositivosService.processarLeitura(dto);
  }

  @Post('leitura-calibracao')
  @ApiOperation({ summary: 'Receber peso lido pelo ESP32 durante calibração' })
  async processarLeituraCalibracao(@Body() dto: LeituraCalibracaoDto): Promise<{ ok: boolean }> {
    return this.dispositivosService.processarLeituraCalibracao(dto);
  }

  @Post('calibracao-status')
  @ApiOperation({ summary: 'Receber status de calibração do ESP32' })
  async processarStatusCalibracao(@Body() dto: CalibracaoStatusDto): Promise<{ ok: boolean }> {
    return this.dispositivosService.processarStatusCalibracao(dto);
  }

  @Post('comando')
  @ApiOperation({ summary: 'Enfileirar comando para o ESP32' })
  async criarComando(@Body() dto: CriarComandoDto): Promise<{ ok: boolean }> {
    return this.dispositivosService.criarComando(dto);
  }

  @Get('comando/:token')
  @ApiOperation({ summary: 'Buscar próximo comando pendente — ESP32 faz polling aqui' })
  async buscarComandoPendente(
    @Param('token') token: string,
  ): Promise<{ comando: string | null; parametro?: string }> {
    return this.dispositivosService.buscarComandoPendente(token);
  }
}
