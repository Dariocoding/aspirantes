-- CreateEnum
CREATE TYPE "TipoEstudioAspirante" AS ENUM ('UNIVERSIDAD', 'TSU');

-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN "tipoEstudio" "TipoEstudioAspirante",
ADD COLUMN "nombreUniversidad" TEXT,
ADD COLUMN "anioIngresoUniversidad" INTEGER,
ADD COLUMN "anioEgresoUniversidad" INTEGER;
