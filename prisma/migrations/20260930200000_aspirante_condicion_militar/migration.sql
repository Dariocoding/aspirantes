-- Condición militar del aspirante (soldado activo / sargento activo).
CREATE TYPE "CondicionMilitar" AS ENUM ('SOLDADO_ACTIVO', 'SARGENTO_ACTIVO');

ALTER TABLE "Aspirante" ADD COLUMN "condicionMilitar" "CondicionMilitar";

CREATE INDEX "Aspirante_condicionMilitar_idx" ON "Aspirante"("condicionMilitar");
