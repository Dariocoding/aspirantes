-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_ESTABLE');

-- AlterTable
ALTER TABLE "Aspirante" ADD COLUMN "estadoCivil" "EstadoCivil";
