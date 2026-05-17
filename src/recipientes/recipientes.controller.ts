import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Recipiente } from '@prisma/client';
import { RecipientesService } from './recipientes.service';
import { CreateRecipienteDto } from './dto/create-recipiente.dto';
import { CalibrarRecipienteDto } from './dto/calibrar-recipiente.dto';

@ApiTags('recipientes')
@Controller('recipientes')
export class RecipientesController {
  constructor(private readonly recipientesService: RecipientesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar recipiente' })
  async create(@Body() dto: CreateRecipienteDto): Promise<Recipiente> {
    return this.recipientesService.create(dto);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Listar recipientes do usuário' })
  async findAllByUsuario(@Param('usuarioId') usuarioId: string): Promise<Recipiente[]> {
    return this.recipientesService.findAllByUsuario(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar recipiente por ID' })
  async findOne(@Param('id') id: string): Promise<Recipiente> {
    return this.recipientesService.findOne(id);
  }

  @Patch(':id/calibrar')
  @ApiOperation({
    summary: 'Calibrar recipiente',
    description: 'Salva o peso vazio do recipiente para cálculo de goles',
  })
  async calibrar(@Param('id') id: string, @Body() dto: CalibrarRecipienteDto): Promise<Recipiente> {
    return this.recipientesService.calibrar(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover recipiente' })
  async remove(@Param('id') id: string): Promise<Recipiente> {
    return this.recipientesService.remove(id);
  }
}
