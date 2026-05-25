import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { DispositivosService } from './dispositivos.service';
import { PrismaService } from '../prisma/prisma.service';
import { HidratacaoGateway } from '../gateway/hidratacao.gateway';

const mockPrisma = {
  usuario: { findUnique: jest.fn() },
  dispositivo: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  recipiente: { findUnique: jest.fn(), findFirst: jest.fn() },
  logHidratacao: { create: jest.fn() },
  comandoDispositivo: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
};

const mockGateway = {
  emitirGole: jest.fn(),
  emitirStatusCalibracao: jest.fn(),
  emitirComando: jest.fn(),
};

describe('DispositivosService', () => {
  let service: DispositivosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispositivosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HidratacaoGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<DispositivosService>(DispositivosService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar dispositivo com token gerado automaticamente', async () => {
      mockPrisma.dispositivo.create.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-gerado',
      });

      const result = await service.create();

      expect(result.tokenAcesso).toBeDefined();
      expect(mockPrisma.dispositivo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('vincular', () => {
    it('deve lançar erro se token inválido', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue(null);

      await expect(
        service.vincular({ tokenAcesso: 'token-invalido', usuarioId: 'usuario-1' }),
      ).rejects.toThrow(Error);
    });

    it('deve vincular dispositivo ao usuário', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue({ id: 'disp-1', tokenAcesso: 'token' });
      mockPrisma.usuario.findUnique.mockResolvedValue({ id: 'usuario-1' });
      mockPrisma.dispositivo.update.mockResolvedValue({
        id: 'disp-1',
        usuarioAtivoId: 'usuario-1',
      });

      const result = await service.vincular({ tokenAcesso: 'token', usuarioId: 'usuario-1' });

      expect(result.usuarioAtivoId).toBe('usuario-1');
    });
  });

  describe('processarLeitura', () => {
    it('deve lançar erro com token inválido', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue(null);

      await expect(
        service.processarLeitura({ tokenAcesso: 'invalido', quantidadeMl: 200 }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar erro se não houver usuário ativo', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-valido',
        usuarioAtivoId: null,
        recipienteAtivo: { id: 'rec-1' },
      });

      await expect(
        service.processarLeitura({ tokenAcesso: 'token-valido', quantidadeMl: 200 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve detectar gole e salvar log', async () => {
      mockPrisma.dispositivo.findUnique.mockResolvedValue({
        id: 'disp-1',
        tokenAcesso: 'token-valido',
        usuarioAtivoId: 'usuario-1',
        recipienteAtivo: { id: 'rec-1' },
      });
      mockPrisma.dispositivo.update.mockResolvedValue({});
      mockPrisma.logHidratacao.create.mockResolvedValue({});

      const result = await service.processarLeitura({
        tokenAcesso: 'token-valido',
        quantidadeMl: 200,
      });

      expect(result.evento).toBe('gole');
      expect(result.quantidadeMl).toBe(200);
      expect(mockPrisma.logHidratacao.create).toHaveBeenCalledTimes(1);
      expect(mockGateway.emitirGole).toHaveBeenCalledWith('usuario-1', 200);
    });
  });
});
