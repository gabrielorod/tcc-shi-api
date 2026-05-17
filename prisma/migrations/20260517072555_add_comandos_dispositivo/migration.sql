-- CreateTable
CREATE TABLE "comandos_dispositivo" (
    "id" TEXT NOT NULL,
    "dispositivo_id" TEXT NOT NULL,
    "comando" TEXT NOT NULL,
    "parametro" TEXT,
    "executado" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comandos_dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comandos_dispositivo_dispositivo_id_executado_idx" ON "comandos_dispositivo"("dispositivo_id", "executado");

-- AddForeignKey
ALTER TABLE "comandos_dispositivo" ADD CONSTRAINT "comandos_dispositivo_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
