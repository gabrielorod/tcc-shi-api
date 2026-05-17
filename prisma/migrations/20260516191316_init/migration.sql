-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoRecipiente" AS ENUM ('COPO', 'GARRAFA', 'CANECA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "peso_kg" DOUBLE PRECISION NOT NULL,
    "altura_cm" DOUBLE PRECISION NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "meta_diaria_ml" DOUBLE PRECISION NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipientes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoRecipiente" NOT NULL,
    "peso_vazio_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "recipiente_ativo_id" TEXT,
    "token_acesso" TEXT NOT NULL,
    "peso_atual_na_mesa_g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimo_ping_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_hidratacao" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "dispositivo_id" TEXT NOT NULL,
    "recipiente_id" TEXT NOT NULL,
    "quantidade_ml" DOUBLE PRECISION NOT NULL,
    "peso_antes_g" DOUBLE PRECISION NOT NULL,
    "peso_depois_g" DOUBLE PRECISION NOT NULL,
    "registrado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_hidratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lembretes" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "intervalo_minutos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_alerta_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lembretes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_recipiente_ativo_id_key" ON "dispositivos"("recipiente_ativo_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_token_acesso_key" ON "dispositivos"("token_acesso");

-- CreateIndex
CREATE INDEX "logs_hidratacao_usuario_id_registrado_em_idx" ON "logs_hidratacao"("usuario_id", "registrado_em");

-- AddForeignKey
ALTER TABLE "recipientes" ADD CONSTRAINT "recipientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_recipiente_ativo_id_fkey" FOREIGN KEY ("recipiente_ativo_id") REFERENCES "recipientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_hidratacao" ADD CONSTRAINT "logs_hidratacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_hidratacao" ADD CONSTRAINT "logs_hidratacao_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_hidratacao" ADD CONSTRAINT "logs_hidratacao_recipiente_id_fkey" FOREIGN KEY ("recipiente_id") REFERENCES "recipientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lembretes" ADD CONSTRAINT "lembretes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
