import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Dispositivo } from '@prisma/client';
import { DispositivosService } from './dispositivos.service';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { SelecionarRecipienteDto } from './dto/selecionar-recipiente.dto';
import { LeituraBalancaDto } from './dto/leitura-balanca.dto';
import { CriarComandoDto } from './dto/criar-comando.dto';
import { CalibracaoStatusDto } from './dto/calibracao-status.dto';

@ApiTags('dispositivos')
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly dispositivosService: DispositivosService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar dispositivo ESP32',
    description: 'Gera automaticamente o tokenAcesso para o firmware',
  })
  async create(@Body() dto: CreateDispositivoDto): Promise<Dispositivo> {
    return this.dispositivosService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar dispositivo por ID' })
  async findOne(@Param('id') id: string): Promise<Dispositivo> {
    return this.dispositivosService.findOne(id);
  }

  @Patch(':id/recipiente')
  @ApiOperation({
    summary: 'Selecionar recipiente ativo',
    description: 'Define qual recipiente está na balança no momento',
  })
  async selecionarRecipiente(
    @Param('id') id: string,
    @Body() dto: SelecionarRecipienteDto,
  ): Promise<Dispositivo> {
    return this.dispositivosService.selecionarRecipiente(id, dto);
  }

  @Post('leitura')
  @ApiOperation({
    summary: 'Receber leitura da balança',
    description: 'Endpoint chamado pelo ESP32. Detecta gole ou recarga automaticamente.',
  })
  async processarLeitura(
    @Body() dto: LeituraBalancaDto,
  ): Promise<{ evento: string; quantidadeMl?: number }> {
    return this.dispositivosService.processarLeitura(dto);
  }

  @Post('comando')
  @ApiOperation({ summary: 'Enfileirar comando para o ESP32 (Frontend → ESP32)' })
  async criarComando(@Body() dto: CriarComandoDto): Promise<{ ok: boolean }> {
    return this.dispositivosService.criarComando(dto);
  }

  @Get('comando/:token')
  @ApiOperation({ summary: 'Buscar próximo comando pendente (ESP32 faz polling aqui)' })
  async buscarComandoPendente(
    @Param('token') token: string,
  ): Promise<{ comando: string | null; parametro?: string }> {
    return this.dispositivosService.buscarComandoPendente(token);
  }

  @Post('calibracao-status')
  @ApiOperation({ summary: 'Receber status de calibração do ESP32 e repassar ao frontend' })
  async processarStatusCalibracao(@Body() dto: CalibracaoStatusDto): Promise<{ ok: boolean }> {
    return this.dispositivosService.processarStatusCalibracao(dto);
  }
}
