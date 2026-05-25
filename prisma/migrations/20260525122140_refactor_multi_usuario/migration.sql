/*
  Warnings:

  - You are about to drop the column `usuario_id` on the `dispositivos` table. All the data in the column will be lost.
  - You are about to alter the column `peso_atual_na_mesa_g` on the `dispositivos` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `quantidade_ml` on the `logs_hidratacao` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `peso_antes_g` on the `logs_hidratacao` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `peso_depois_g` on the `logs_hidratacao` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `peso_vazio_g` on the `recipientes` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `peso_kg` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `altura_cm` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `meta_diaria_ml` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `lembretes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "dispositivos" DROP CONSTRAINT "dispositivos_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "lembretes" DROP CONSTRAINT "lembretes_usuario_id_fkey";

-- AlterTable
ALTER TABLE "dispositivos" DROP COLUMN "usuario_id",
ADD COLUMN     "grace_period_minutos" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "usuarioId" TEXT,
ADD COLUMN     "usuario_ativo_id" TEXT,
ALTER COLUMN "peso_atual_na_mesa_g" SET DEFAULT 0,
ALTER COLUMN "peso_atual_na_mesa_g" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "logs_hidratacao" ALTER COLUMN "quantidade_ml" SET DATA TYPE INTEGER,
ALTER COLUMN "peso_antes_g" SET DATA TYPE INTEGER,
ALTER COLUMN "peso_depois_g" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "recipientes" ALTER COLUMN "peso_vazio_g" SET DEFAULT 0,
ALTER COLUMN "peso_vazio_g" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "peso_kg" SET DATA TYPE INTEGER,
ALTER COLUMN "altura_cm" SET DATA TYPE INTEGER,
ALTER COLUMN "meta_diaria_ml" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "lembretes";

-- AddForeignKey
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_usuario_ativo_id_fkey" FOREIGN KEY ("usuario_ativo_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos" ADD CONSTRAINT "dispositivos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
