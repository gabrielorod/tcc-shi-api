import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Lembrete } from '@prisma/client';
import { LembretesService } from './lembretes.service';
import { CreateLembreteDto } from '../logs-hidratacao/dto/create-lembrete.dto';

@ApiTags('lembretes')
@Controller('lembretes')
export class LembretesController {
  constructor(private readonly lembretesService: LembretesService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar lembrete',
    description: 'Define intervalo em minutos para alertas de hidratação',
  })
  async create(@Body() dto: CreateLembreteDto): Promise<Lembrete> {
    return this.lembretesService.create(dto);
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ summary: 'Listar lembretes do usuário' })
  async findAllByUsuario(@Param('usuarioId') usuarioId: string): Promise<Lembrete[]> {
    return this.lembretesService.findAllByUsuario(usuarioId);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Ativar/desativar lembrete' })
  async toggleAtivo(@Param('id') id: string): Promise<Lembrete> {
    return this.lembretesService.toggleAtivo(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover lembrete' })
  async remove(@Param('id') id: string): Promise<Lembrete> {
    return this.lembretesService.remove(id);
  }
}
