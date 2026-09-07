-- CreateTable
CREATE TABLE "Peloton" (
    "id" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Peloton_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN "pelotonId" TEXT;

-- CreateIndex
CREATE INDEX "Peloton_convocatoriaId_idx" ON "Peloton"("convocatoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "Peloton_convocatoriaId_numero_key" ON "Peloton"("convocatoriaId", "numero");

-- CreateIndex
CREATE INDEX "Aspirante_pelotonId_idx" ON "Aspirante"("pelotonId");

-- AddForeignKey
ALTER TABLE "Peloton" ADD CONSTRAINT "Peloton_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "Convocatoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aspirante" ADD CONSTRAINT "Aspirante_pelotonId_fkey" FOREIGN KEY ("pelotonId") REFERENCES "Peloton"("id") ON DELETE SET NULL ON UPDATE CASCADE;
