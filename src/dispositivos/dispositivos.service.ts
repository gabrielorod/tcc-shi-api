import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Dispositivo } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { HidratacaoGateway } from '../gateway/hidratacao.gateway';
import { SelecionarRecipienteDto } from './dto/selecionar-recipiente.dto';
import { LeituraBalancaDto } from './dto/leitura-balanca.dto';
import { CriarComandoDto } from './dto/criar-comando.dto';
import { CalibracaoStatusDto } from './dto/calibracao-status.dto';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { UsarAgoraDto } from './dto/usar-agora.dto';
import { AtualizarConfiguracoesDto } from './dto/atualizar-configuracoes.dto';
import { LeituraCalibracaoDto } from './dto/leitura-calibracao.dto';

@Injectable()
export class DispositivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: HidratacaoGateway,
  ) {}

  // Cria um novo dispositivo com token gerado automaticamente
  async create(): Promise<Dispositivo> {
    return this.prisma.dispositivo.create({
      data: { tokenAcesso: randomUUID() },
    });
  }

  async findOne(id: string): Promise<Dispositivo> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id },
      include: { recipienteAtivo: true, usuarioAtivo: true },
    });

    if (!dispositivo) {
      throw new NotFoundException(`Dispositivo ${id} não encontrado`);
    }

    return dispositivo;
  }

  // Usuário digita o token no app para vincular o dispositivo
  async vincular(dto: VincularDispositivoDto): Promise<Dispositivo> {
    let dispositivo = await this.prisma.dispositivo.findUnique({
      where: { tokenAcesso: dto.tokenAcesso },
    });

    if (!dispositivo) {
      dispositivo = await this.prisma.dispositivo.create({
        data: { tokenAcesso: dto.tokenAcesso },
      });
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuário ${dto.usuarioId} não encontrado`);
    }

    // Busca recipiente calibrado do usuário
    const recipiente = await this.prisma.recipiente.findFirst({
      where: { usuarioId: dto.usuarioId, ativo: true, pesoVazioG: { gt: 0 } },
    });

    // Se o recipiente já está em outro dispositivo, desvincula primeiro
    if (recipiente) {
      await this.prisma.dispositivo.updateMany({
        where: {
          recipienteAtivoId: recipiente.id,
          NOT: { id: dispositivo.id },
        },
        data: { recipienteAtivoId: null },
      });
    }

    return this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: {
        usuarioAtivoId: dto.usuarioId,
        recipienteAtivoId: recipiente?.id ?? null,
      },
      include: { recipienteAtivo: true, usuarioAtivo: true },
    });
  }

  // Inicia o processo de calibração enviando o peso conhecido para o ESP32
  async iniciarCalibracao(dispositivoId: string, pesoConhecidoG: number): Promise<{ ok: boolean }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id: dispositivoId },
    });

    if (!dispositivo) {
      throw new NotFoundException(`Dispositivo ${dispositivoId} não encontrado`);
    }

    this.gateway.emitirComando(dispositivo.tokenAcesso, 'calibrar_balanca', String(pesoConhecidoG));

    return { ok: true };
  }

  // Troca o usuário ativo no dispositivo
  async usarAgora(id: string, dto: UsarAgoraDto): Promise<Dispositivo> {
    const dispositivo = await this.findOne(id);

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuário ${dto.usuarioId} não encontrado`);
    }

    const recipiente = await this.prisma.recipiente.findFirst({
      where: { usuarioId: dto.usuarioId, ativo: true, pesoVazioG: { gt: 0 } },
    });

    if (recipiente) {
      await this.prisma.dispositivo.updateMany({
        where: {
          recipienteAtivoId: recipiente.id,
          NOT: { id: dispositivo.id },
        },
        data: { recipienteAtivoId: null },
      });
    }

    return this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: {
        usuarioAtivoId: dto.usuarioId,
        recipienteAtivoId: recipiente?.id ?? null,
      },
      include: { recipienteAtivo: true, usuarioAtivo: true },
    });
  }

  async selecionarRecipiente(id: string, dto: SelecionarRecipienteDto): Promise<Dispositivo> {
    const dispositivo = await this.findOne(id);

    const recipiente = await this.prisma.recipiente.findUnique({
      where: { id: dto.recipienteId },
    });

    if (!recipiente) {
      throw new BadRequestException(`Recipiente ${dto.recipienteId} não encontrado`);
    }

    if (recipiente.pesoVazioG === 0) {
      throw new BadRequestException('Recipiente não calibrado. Calibre antes de selecionar');
    }

    return this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: {
        recipienteAtivoId: dto.recipienteId,
        pesoAtualNaMesaG: recipiente.pesoVazioG,
      },
    });
  }

  async atualizarConfiguracoes(id: string, dto: AtualizarConfiguracoesDto): Promise<Dispositivo> {
    await this.findOne(id);

    return this.prisma.dispositivo.update({
      where: { id },
      data: {
        ...(dto.gracePeriodMinutos !== undefined && {
          gracePeriodMinutos: dto.gracePeriodMinutos,
        }),
        ...(dto.horarioAcordar !== undefined && {
          horarioAcordar: dto.horarioAcordar,
        }),
        ...(dto.horarioDormir !== undefined && {
          horarioDormir: dto.horarioDormir,
        }),
      },
    });
  }

  async processarLeitura(
    dto: LeituraBalancaDto,
  ): Promise<{ evento: string; quantidadeMl?: number }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { tokenAcesso: dto.tokenAcesso },
      include: { recipienteAtivo: true },
    });

    if (!dispositivo) {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    if (!dispositivo.usuarioAtivoId) {
      throw new BadRequestException('Nenhum usuário ativo no dispositivo');
    }

    if (!dispositivo.recipienteAtivo) {
      throw new BadRequestException('Nenhum recipiente selecionado no dispositivo');
    }

    await this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: { ultimoPingEm: new Date() },
    });

    await this.prisma.logHidratacao.create({
      data: {
        usuarioId: dispositivo.usuarioAtivoId,
        dispositivoId: dispositivo.id,
        recipienteId: dispositivo.recipienteAtivo.id,
        quantidadeMl: dto.quantidadeMl,
        pesoAntesG: 0,
        pesoDepoisG: 0,
      },
    });

    this.gateway.emitirGole(dispositivo.usuarioAtivoId, dto.quantidadeMl);

    return { evento: 'gole', quantidadeMl: dto.quantidadeMl };
  }

  // Recebe o peso lido pelo ESP32 durante a calibração e salva no recipiente
  async processarLeituraCalibracao(dto: LeituraCalibracaoDto): Promise<{ ok: boolean }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { tokenAcesso: dto.tokenAcesso },
    });

    if (!dispositivo) {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    await this.prisma.recipiente.update({
      where: { id: dto.recipienteId },
      data: { pesoVazioG: dto.pesoVazioG },
    });

    const usuarioAtivoId = dispositivo.usuarioAtivoId;
    if (usuarioAtivoId) {
      this.gateway.emitirStatusCalibracao(
        usuarioAtivoId,
        `Calibrado! Peso vazio: ${String(dto.pesoVazioG)}g`,
      );
      this.gateway.emitirStatusCalibracao(usuarioAtivoId, 'ok');
    }

    return { ok: true };
  }

  async criarComando(dto: CriarComandoDto): Promise<{ ok: boolean }> {
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { id: dto.dispositivoId },
    });

    if (!dispositivo) {
      throw new NotFoundException(`Dispositivo ${dto.dispositivoId} não encontrado`);
    }

    this.gateway.emitirComando(dispositivo.tokenAcesso, dto.comando, dto.parametro);

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

    await this.prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: { ultimoPingEm: new Date() },
    });

    const comando = await this.prisma.comandoDispositivo.findFirst({
      where: { dispositivoId: dispositivo.id, executado: false },
      orderBy: { criadoEm: 'asc' },
    });

    if (!comando) return { comando: null };

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

    if (dispositivo.usuarioAtivoId) {
      this.gateway.emitirStatusCalibracao(dispositivo.usuarioAtivoId, dto.status);
    }

    return { ok: true };
  }
}
