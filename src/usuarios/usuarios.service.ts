import { Injectable, NotFoundException } from '@nestjs/common';
import { Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const metaDiariaMl = dto.pesoKg * 35;

    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        pesoKg: dto.pesoKg,
        alturaCm: dto.alturaCm,
        sexo: dto.sexo,
        metaDiariaMl,
      },
    });
  }

  async findAll(): Promise<Usuario[]> {
    return this.prisma.usuario.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return usuario;
  }

  async update(id: string, dto: UpdateUsuarioDto): Promise<Usuario> {
    await this.findOne(id);

    const metaDiariaMl =
      dto.metaDiariaMl ?? (dto.pesoKg !== undefined ? dto.pesoKg * 35 : undefined);

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome,
        pesoKg: dto.pesoKg,
        alturaCm: dto.alturaCm,
        sexo: dto.sexo,
        metaDiariaMl,
      },
    });
  }

  async remove(id: string): Promise<Usuario> {
    await this.findOne(id);

    return this.prisma.usuario.delete({
      where: { id },
    });
  }
}
