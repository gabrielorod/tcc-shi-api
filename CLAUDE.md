# SHI — Sistema de Hidratação Inteligente

## Contexto

TCC de Engenharia da Computação (Gabriel e Fabricio). MVP focado em nota máxima na defesa, provando integração Hardware ↔ Software. Sem over-engineering.

## Stack

- **Backend:** NestJS + TypeScript (Controllers, Services, Modules)
- **Banco:** PostgreSQL no Supabase via Prisma (porta 6543, Transaction Pooler)
- **Comunicação:** REST HTTP + WebSockets (Socket.io / NestJS Gateways)
- **Hardware:** ESP32 + HX711 (balança de precisão)
- **Frontend:** React + Vite + TypeScript (repo separado)
- **Hospedagem Backend:** Render (plano gratuito, usa ping via cron-job.org a cada 10min)

## Regras de arquitetura

- Seguir padrão NestJS: Controllers, Services, Modules
- Tipagem estrita em todo TypeScript
- Sem microserviços, Kafka, Redis ou JWT complexo
- Autenticação do ESP32 via `tokenAcesso` simples no header
- Backend e ESP32 conversam via HTTP/WebSocket simples

## Banco de dados (Prisma)

ENUMs: `Sexo` (MASCULINO, FEMININO, OUTRO), `TipoRecipiente` (COPO, GARRAFA, CANECA)

Modelos: `Usuario`, `Recipiente`, `Dispositivo`, `LogHidratacao`, `Lembrete`

- `Dispositivo` guarda `pesoAtualNaMesaG` (base de cálculo) e `tokenAcesso` (auth do ESP32)
- `LogHidratacao` guarda `pesoAntesG`, `pesoDepoisG`, `quantidadeMl` — índice em `[usuarioId, registradoEm]`

## Lógica da balança

- Peso diminuiu → gole → gera `LogHidratacao` com a diferença em mL
- Peso aumentou → recarga → apenas atualiza `pesoAtualNaMesaG`, sem log
- Calibração salva `pesoVazioG` no `Recipiente`

## Fórmula de meta

`metaDiariaMl = pesoKg × 35` (OMS), sobrescrevível pelo usuário

## Variáveis de ambiente necessárias

DATABASE_URL, DIRECT_URL (Supabase), PORT
