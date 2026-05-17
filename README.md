# SHI — Sistema de Hidratação Inteligente

TCC de Engenharia da Computação — Gabriel e Fabricio.

API REST + WebSocket para monitoramento automático de consumo de água via ESP32 acoplado a uma balança de precisão.

## Stack

- **Runtime:** Node.js + NestJS (TypeScript)
- **Banco:** PostgreSQL via Supabase + Prisma ORM
- **Tempo real:** WebSockets (Socket.io)
- **Hardware:** ESP32 + módulo HX711
- **Hospedagem:** Render (backend) + Vercel (frontend)

## Pré-requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Crie um `.env` na raiz com:

```env
DATABASE_URL="postgresql://..."
PORT=3000
```

## Comandos

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Migrations
npx prisma migrate dev

# Gerar client Prisma
npx prisma generate
```

## Documentação da API

Com o servidor rodando, acesse: http://localhost:3000/docs

## Fluxo principal

1. Criar usuário → meta calculada automaticamente (peso × 35ml)
2. Criar e calibrar recipiente → salva peso vazio
3. Registrar dispositivo ESP32 → recebe `tokenAcesso`
4. Selecionar recipiente no dispositivo
5. ESP32 envia leituras via `POST /dispositivos/leitura`
6. API detecta gole (peso diminuiu) ou recarga (peso aumentou)
7. Dashboard atualiza via WebSocket em tempo real

## Endpoints principais

| Método | Rota                                    | Descrição                   |
| ------ | --------------------------------------- | --------------------------- |
| POST   | `/usuarios`                             | Criar usuário               |
| POST   | `/recipientes`                          | Criar recipiente            |
| PATCH  | `/recipientes/:id/calibrar`             | Calibrar recipiente         |
| POST   | `/dispositivos`                         | Registrar ESP32             |
| PATCH  | `/dispositivos/:id/recipiente`          | Selecionar recipiente ativo |
| POST   | `/dispositivos/leitura`                 | Receber leitura da balança  |
| GET    | `/logs-hidratacao/dashboard/:usuarioId` | Dashboard completo          |
| POST   | `/lembretes`                            | Criar lembrete              |
