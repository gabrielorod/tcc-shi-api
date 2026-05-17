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
import { HidratacaoGateway } from '../gateway/hidratacao.gateway';
import { CriarComandoDto } from './dto/criar-comando.dto';
import { CalibracaoStatusDto } from './dto/calibracao-status.dto';

@Injectable()
export class DispositivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: HidratacaoGateway,
  ) {}

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

    // Emite o evento WebSocket para o frontend atualizar o dashboard
    this.gateway.emitirGole(dispositivo.usuarioId, quantidadeMl);

    return { evento: 'gole', quantidadeMl };
  }

  async criarComando(dto: CriarComandoDto): Promise<{ ok: boolean }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id: dto.dispositivoId },
    });

    if (!dispositivo) {
      throw new NotFoundException(`Dispositivo ${dto.dispositivoId} não encontrado`);
    }

    await this.prisma.comandoDispositivo.create({
      data: {
        dispositivoId: dto.dispositivoId,
        comando: dto.comando,
        parametro: dto.parametro,
      },
    });

    return { ok: true };
  }

  async buscarComandoPendente(
    token: string,
  ): Promise<{ comando: string | null; parametro?: string }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { tokenAcesso: token },
    });

    if (!dispositivo) {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    // Atualiza o último ping
    await this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: { ultimoPingEm: new Date() },
    });

    // Busca o comando mais antigo ainda não executado
    const comando = await this.prisma.comandoDispositivo.findFirst({
      where: { dispositivoId: dispositivo.id, executado: false },
      orderBy: { criadoEm: 'asc' },
    });

    if (!comando) {
      return { comando: null };
    }

    // Marca como executado
    await this.prisma.comandoDispositivo.update({
      where: { id: comando.id },
      data: { executado: true },
    });

    return {
      comando: comando.comando,
      parametro: comando.parametro ?? undefined,
    };
  }

  async processarStatusCalibracao(dto: CalibracaoStatusDto): Promise<{ ok: boolean }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { tokenAcesso: dto.tokenAcesso },
    });

    if (!dispositivo) {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    // Emite o status via WebSocket para o frontend
    this.gateway.emitirStatusCalibracao(dispositivo.usuarioId, dto.status);

    return { ok: true };
  }
}
