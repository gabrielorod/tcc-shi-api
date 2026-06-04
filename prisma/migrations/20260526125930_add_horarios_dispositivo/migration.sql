-- AlterTable
ALTER TABLE "dispositivos" ADD COLUMN     "horario_acordar" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "horario_dormir" INTEGER NOT NULL DEFAULT 22;
