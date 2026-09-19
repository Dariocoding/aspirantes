-- Membretes institucionales para exportaciones Excel.
CREATE TABLE "Membrete" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "lineas" TEXT[],
    "logoIzq" TEXT NOT NULL DEFAULT 'cefoa',
    "logoDer" TEXT NOT NULL DEFAULT 'none',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membrete_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Membrete_nombre_key" ON "Membrete"("nombre");
CREATE INDEX "Membrete_isDefault_idx" ON "Membrete"("isDefault");

INSERT INTO "Membrete" ("id", "nombre", "lineas", "logoIzq", "logoDer", "isDefault", "createdAt", "updatedAt")
VALUES (
  'membrete_cefoa45',
  'CEFOA — Oficiales asimilados Nro. 45',
  ARRAY[
    'República Bolivariana de Venezuela',
    'Ministerio del Poder Popular para la Defensa',
    'Ejército Bolivariano',
    'Dirección de Educación del Ejército',
    'Curso Especial de Formación de Oficiales en las Categoría de Asimilados Nro. 45'
  ],
  'cefoa',
  'none',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
