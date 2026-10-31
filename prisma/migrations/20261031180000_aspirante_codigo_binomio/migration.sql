-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN "codigoBinomio" TEXT;

-- CreateIndex
CREATE INDEX "Aspirante_codigoBinomio_idx" ON "Aspirante"("codigoBinomio");

-- CreateIndex
CREATE UNIQUE INDEX "Aspirante_convocatoriaId_codigoBinomio_key" ON "Aspirante"("convocatoriaId", "codigoBinomio");
