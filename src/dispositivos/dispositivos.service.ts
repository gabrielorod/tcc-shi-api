import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Dispositivo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto';
import { SelecionarRecipienteDto } from './dto/selecionar-recipiente.dto';
import { LeituraBalancaDto } from './dto/leitura-balanca.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class DispositivosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDispositivoDto): Promise<Dispositivo> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuário ${dto.usuarioId} não encontrado`);
    }

    return this.prisma.dispositivo.create({
      data: {
        usuarioId: dto.usuarioId,
        tokenAcesso: randomUUID(), // Token simples gerado automaticamente
      },
    });
  }

  async findOne(id: string): Promise<Dispositivo> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id },
      include: { recipienteAtivo: true },
    });

    if (!dispositivo) {
      throw new NotFoundException(`Dispositivo ${id} não encontrado`);
    }

    return dispositivo;
  }

  async selecionarRecipiente(id: string, dto: SelecionarRecipienteDto): Promise<Dispositivo> {
    const dispositivo = await this.findOne(id);

    const recipiente = await this.prisma.recipiente.findUnique({
      where: { id: dto.recipienteId },
    });

    if (!recipiente) {
      throw new BadRequestException(`Recipiente ${dto.recipienteId} não encontrado`);
    }

    if (recipiente.usuarioId !== dispositivo.usuarioId) {
      throw new BadRequestException(`Recipiente não pertence ao usuário do dispositivo`);
    }

    if (recipiente.pesoVazioG === 0) {
      throw new BadRequestException(`Recipiente não calibrado. Calibre antes de selecionar`);
    }

    return this.prisma.dispositivo.update({
      where: { id },
      data: {
        recipienteAtivoId: dto.recipienteId,
        pesoAtualNaMesaG: recipiente.pesoVazioG, // Inicia com o peso vazio
      },
    });
  }

  async processarLeitura(
    dto: LeituraBalancaDto,
  ): Promise<{ evento: string; quantidadeMl?: number }> {
    // Busca dispositivo pelo token
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { tokenAcesso: dto.tokenAcesso },
      include: { recipienteAtivo: true },
    });

    if (!dispositivo) {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    if (!dispositivo.recipienteAtivo) {
      throw new BadRequestException('Nenhum recipiente selecionado no dispositivo');
    }

    const diferenca = dispositivo.pesoAtualNaMesaG - dto.pesoAtualG;
    const TOLERANCIA_G = 5; // Ignora variações menores que 5g (ruído da balança)

    // Atualiza o ping do dispositivo
    await this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: { ultimoPingEm: new Date() },
    });

    // Variação insignificante — ignora
    if (Math.abs(diferenca) < TOLERANCIA_G) {
      return { evento: 'sem_alteracao' };
    }

    // Peso aumentou — recarga
    if (diferenca < 0) {
      await this.prisma.dispositivo.update({
        where: { id: dispositivo.id },
        data: { pesoAtualNaMesaG: dto.pesoAtualG },
      });
      return { evento: 'recarga' };
    }

    // Peso diminuiu — gole detectado
    const quantidadeMl = diferenca; // 1g ≈ 1ml para água

    await this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: { pesoAtualNaMesaG: dto.pesoAtualG },
    });

    await this.prisma.logHidratacao.create({
      data: {
        usuarioId: dispositivo.usuarioId,
        dispositivoId: dispositivo.id,
        recipienteId: dispositivo.recipienteAtivo.id,
        quantidadeMl,
        pesoAntesG: dispositivo.pesoAtualNaMesaG,
        pesoDepoisG: dto.pesoAtualG,
      },
    });

    return { evento: 'gole', quantidadeMl };
  }
}
