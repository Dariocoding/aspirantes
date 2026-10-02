-- CreateEnum
CREATE TYPE "JerarquiaAspirante" AS ENUM ('ASPIRANTE_OFICIAL', 'DISTINGUIDO');

-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN "jerarquia" "JerarquiaAspirante" NOT NULL DEFAULT 'ASPIRANTE_OFICIAL';

-- CreateIndex
CREATE INDEX "Aspirante_jerarquia_idx" ON "Aspirante"("jerarquia");
