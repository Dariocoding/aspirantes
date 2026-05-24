-- CreateTable
CREATE TABLE "Convocatoria" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convocatoria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Convocatoria_codigo_key" ON "Convocatoria"("codigo");

CREATE INDEX "Convocatoria_anio_idx" ON "Convocatoria"("anio");

CREATE INDEX "Convocatoria_activa_idx" ON "Convocatoria"("activa");

INSERT INTO "Convocatoria" ("id", "codigo", "nombre", "anio", "activa", "createdAt", "updatedAt")
VALUES (
    'seed_convocatoria_legacy',
    'LEGADO-IMPORT',
    'Registros previos (migración)',
    2025,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "Aspirante" ADD COLUMN "convocatoriaId" TEXT;

UPDATE "Aspirante" SET "convocatoriaId" = 'seed_convocatoria_legacy' WHERE "convocatoriaId" IS NULL;

ALTER TABLE "Aspirante" ALTER COLUMN "convocatoriaId" SET NOT NULL;

DROP INDEX "Aspirante_cedula_key";

ALTER TABLE "Aspirante" ADD CONSTRAINT "Aspirante_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "Convocatoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Aspirante_cedula_convocatoriaId_key" ON "Aspirante"("cedula", "convocatoriaId");
