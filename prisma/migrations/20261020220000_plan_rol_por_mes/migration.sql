-- AlterTable
ALTER TABLE "PlanRolServicio" ADD COLUMN "nombre" TEXT;
ALTER TABLE "PlanRolServicio" ADD COLUMN "categoria" "CategoriaRolServicio" NOT NULL DEFAULT 'OTROS';
ALTER TABLE "PlanRolServicio" ADD COLUMN "conAutoridad" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlanRolServicio" ADD COLUMN "papelNocturno" "PapelNocturnoRol" NOT NULL DEFAULT 'NINGUNO';

UPDATE "PlanRolServicio" AS plan
SET
  "nombre" = rol."nombre",
  "categoria" = rol."categoria",
  "conAutoridad" = rol."conAutoridad",
  "papelNocturno" = rol."papelNocturno"
FROM "RolServicio" AS rol
WHERE plan."rolServicioId" = rol."id";

UPDATE "PlanRolServicio" SET "nombre" = 'Rol' WHERE "nombre" IS NULL;

ALTER TABLE "PlanRolServicio" ALTER COLUMN "nombre" SET NOT NULL;
