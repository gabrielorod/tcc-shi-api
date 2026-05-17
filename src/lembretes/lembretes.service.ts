import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Lembrete } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLembreteDto } from '../logs-hidratacao/dto/create-lembrete.dto';

@Injectable()
export class LembretesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLembreteDto): Promise<Lembrete> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuário ${dto.usuarioId} não encontrado`);
    }

    return this.prisma.lembrete.create({
      data: {
        usuarioId: dto.usuarioId,
        intervaloMinutos: dto.intervaloMinutos,
      },
    });
  }

  async findAllByUsuario(usuarioId: string): Promise<Lembrete[]> {
    return this.prisma.lembrete.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async toggleAtivo(id: string): Promise<Lembrete> {
    const lembrete = await this.prisma.lembrete.findUnique({ where: { id } });

    if (!lembrete) {
      throw new NotFoundException(`Lembrete ${id} não encontrado`);
    }

    return this.prisma.lembrete.update({
      where: { id },
      data: { ativo: !lembrete.ativo },
    });
  }

  async remove(id: string): Promise<Lembrete> {
    const lembrete = await this.prisma.lembrete.findUnique({ where: { id } });

    if (!lembrete) {
      throw new NotFoundException(`Lembrete ${id} não encontrado`);
    }

    return this.prisma.lembrete.delete({ where: { id } });
  }

  // Chamado pelo scheduler para verificar lembretes pendentes
  async verificarLembretes(): Promise<Lembrete[]> {
    const agora = new Date();

    const lembretes = await this.prisma.lembrete.findMany({
      where: { ativo: true },
    });

    const pendentes: Lembrete[] = [];

    for (const lembrete of lembretes) {
      const referencia = lembrete.ultimoAlertaEm ?? lembrete.criadoEm;
      const minutosPassados = (agora.getTime() - referencia.getTime()) / 60000;

      if (minutosPassados >= lembrete.intervaloMinutos) {
        // Verifica se houve hidratação no intervalo
        const logRecente = await this.prisma.logHidratacao.findFirst({
          where: {
            usuarioId: lembrete.usuarioId,
            registradoEm: { gte: referencia },
          },
        });

        if (!logRecente) {
          pendentes.push(lembrete);

          await this.prisma.lembrete.update({
            where: { id: lembrete.id },
            data: { ultimoAlertaEm: agora },
          });
        }
      }
    }

    return pendentes;
  }
}
