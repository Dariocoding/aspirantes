-- CreateEnum
CREATE TYPE "CalificacionAdmision" AS ENUM ('APTO', 'NO_APTO', 'EN_EVALUACION');

-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN     "calificacionAdmision" "CalificacionAdmision" NOT NULL DEFAULT 'EN_EVALUACION',
ADD COLUMN     "unidadPostulante" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Aspirante_calificacionAdmision_idx" ON "Aspirante"("calificacionAdmision");

-- CreateIndex
CREATE INDEX "Aspirante_unidadPostulante_idx" ON "Aspirante"("unidadPostulante");
