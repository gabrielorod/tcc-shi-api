import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Dispositivo } from '@prisma/client';
import { DispositivosService } from './dispositivos.service';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { SelecionarRecipienteDto } from './dto/selecionar-recipiente.dto';
import { LeituraBalancaDto } from './dto/leitura-balanca.dto';

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
}
