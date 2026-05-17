import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DispositivosService } from './dispositivos.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  usuario: { findUnique: jest.fn() },
  dispositivo: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  recipiente: { findUnique: jest.fn() },
  logHidratacao: { create: jest.fn() },
};

describe('DispositivosService', () => {
  let service: DispositivosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DispositivosService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<DispositivosService>(DispositivosService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve lançar erro se usuário não existir', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.create({ usuarioId: 'id-inexistente' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve criar dispositivo com token gerado automaticamente', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-1' });
      mockPrisma.dispositivo.create.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-gerado',
        usuarioId: 'usuario-1',
      });

      const result = await service.create({ usuarioId: 'usuario-1' });

      expect(result.tokenAcesso).toBeDefined();
      expect(mockPrisma.dispositivo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('processarLeitura', () => {
    it('deve lançar erro com token inválido', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue(null);

      await expect(
        service.processarLeitura({ tokenAcesso: 'invalido', pesoAtualG: 500 }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve retornar sem_alteracao para variação menor que tolerância', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-valido',
        pesoAtualNaMesaG: 500,
        usuarioId: 'usuario-1',
        recipienteAtivo: { id: 'rec-1' },
      });
      mockPrisma.dispositivo.update.mockResolvedValue({});

      const result = await service.processarLeitura({
        tokenAcesso: 'token-valido',
        pesoAtualG: 503, // diferença de 3g, abaixo da tolerância de 5g
      });

      expect(result.evento).toBe('sem_alteracao');
    });

    it('deve detectar gole quando peso diminui', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-valido',
        pesoAtualNaMesaG: 800,
        usuarioId: 'usuario-1',
        recipienteAtivo: { id: 'rec-1' },
      });
      mockPrisma.dispositivo.update.mockResolvedValue({});
      mockPrisma.logHidratacao.create.mockResolvedValue({});

      const result = await service.processarLeitura({
        tokenAcesso: 'token-valido',
        pesoAtualG: 600,
      });

      expect(result.evento).toBe('gole');
      expect(result.quantidadeMl).toBe(200);
      expect(mockPrisma.logHidratacao.create).toHaveBeenCalledTimes(1);
    });

    it('deve detectar recarga quando peso aumenta', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-valido',
        pesoAtualNaMesaG: 400,
        usuarioId: 'usuario-1',
        recipienteAtivo: { id: 'rec-1' },
      });
      mockPrisma.dispositivo.update.mockResolvedValue({});

      const result = await service.processarLeitura({
        tokenAcesso: 'token-valido',
        pesoAtualG: 900,
      });

      expect(result.evento).toBe('recarga');
      expect(mockPrisma.logHidratacao.create).not.toHaveBeenCalled();
    });
  });
});
