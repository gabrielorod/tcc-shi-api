import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Recipiente } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipienteDto } from './dto/create-recipiente.dto';
import { CalibrarRecipienteDto } from './dto/calibrar-recipiente.dto';

@Injectable()
export class RecipientesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecipienteDto): Promise<Recipiente> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new BadRequestException(`Usuário ${dto.usuarioId} não encontrado`);
    }

    return this.prisma.recipiente.create({
      data: {
        nome: dto.nome,
        tipo: dto.tipo,
        usuarioId: dto.usuarioId,
      },
    });
  }

  async findAllByUsuario(usuarioId: string): Promise<Recipiente[]> {
    return this.prisma.recipiente.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string): Promise<Recipiente> {
    const recipiente = await this.prisma.recipiente.findUnique({
      where: { id },
    });

    if (!recipiente) {
      throw new NotFoundException(`Recipiente ${id} não encontrado`);
    }

    return recipiente;
  }

  async calibrar(id: string, dto: CalibrarRecipienteDto): Promise<Recipiente> {
    await this.findOne(id);

    return this.prisma.recipiente.update({
      where: { id },
      data: { pesoVazioG: dto.pesoVazioG },
    });
  }

  async remove(id: string): Promise<Recipiente> {
    await this.findOne(id);

    return this.prisma.recipiente.delete({
      where: { id },
    });
  }
}
