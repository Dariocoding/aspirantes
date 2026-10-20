-- CreateEnum
CREATE TYPE "CategoriaRolServicio" AS ENUM ('OFICIAL', 'SANIDAD', 'INSPECCION', 'CUARTEL', 'BANO', 'COMEDOR', 'AULA', 'ESTACIONAMIENTO', 'OTROS');

-- CreateEnum
CREATE TYPE "PapelNocturnoRol" AS ENUM ('NINGUNO', 'RONDA', 'RONDIN', 'TURNO_1', 'TURNO_2', 'TURNO_3', 'MARCA_TURNO');

-- AlterTable
ALTER TABLE "RolServicio" ADD COLUMN "categoria" "CategoriaRolServicio" NOT NULL DEFAULT 'OTROS';
ALTER TABLE "RolServicio" ADD COLUMN "conAutoridad" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RolServicio" ADD COLUMN "papelNocturno" "PapelNocturnoRol" NOT NULL DEFAULT 'NINGUNO';

-- Clasifica los roles que ya existen por el nombre.
UPDATE "RolServicio"
SET "categoria" = 'ESTACIONAMIENTO', "papelNocturno" = 'MARCA_TURNO'
WHERE nombre ~* 'estacionamiento';

UPDATE "RolServicio"
SET "categoria" = 'OFICIAL', "conAutoridad" = true, "papelNocturno" = 'RONDA'
WHERE "categoria" = 'OTROS' AND nombre ~* 'oficial';

UPDATE "RolServicio"
SET "categoria" = 'SANIDAD'
WHERE "categoria" = 'OTROS' AND nombre ~* 'enfermer|medicin|sanidad';

UPDATE "RolServicio"
SET "categoria" = 'INSPECCION', "papelNocturno" = 'RONDIN'
WHERE "categoria" = 'OTROS' AND nombre ~* 'inspecci';

UPDATE "RolServicio"
SET "categoria" = 'CUARTEL', "papelNocturno" = 'TURNO_2'
WHERE "categoria" = 'OTROS' AND nombre ~* 'cuarteler';

UPDATE "RolServicio"
SET "categoria" = 'BANO', "papelNocturno" = 'TURNO_3'
WHERE "categoria" = 'OTROS' AND nombre ~* 'ba[nñ]o';

UPDATE "RolServicio"
SET "categoria" = 'COMEDOR'
WHERE "categoria" = 'OTROS' AND nombre ~* 'comedor';

UPDATE "RolServicio"
SET "categoria" = 'AULA', "papelNocturno" = 'TURNO_1'
WHERE "categoria" = 'OTROS' AND nombre ~* 'aula';
