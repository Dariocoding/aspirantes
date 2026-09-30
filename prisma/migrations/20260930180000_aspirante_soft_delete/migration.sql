-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByEmail" TEXT;

-- CreateIndex
CREATE INDEX "Aspirante_deletedAt_idx" ON "Aspirante"("deletedAt");
