-- Roles de servicio mensuales y su vínculo opcional con un aspirante del censo.

CREATE TABLE "RolServicio" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolServicio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RolServicio_clave_key" ON "RolServicio"("clave");

CREATE TABLE "PlanRolServicio" (
    "id" TEXT NOT NULL,
    "rolServicioId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanRolServicio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanRolServicio_rolServicioId_anio_mes_key" ON "PlanRolServicio"("rolServicioId", "anio", "mes");
CREATE INDEX "PlanRolServicio_anio_mes_idx" ON "PlanRolServicio"("anio", "mes");

ALTER TABLE "PlanRolServicio"
ADD CONSTRAINT "PlanRolServicio_rolServicioId_fkey"
FOREIGN KEY ("rolServicioId") REFERENCES "RolServicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AsignacionRolServicio" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "grado" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "aspiranteId" TEXT,
    "dias" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsignacionRolServicio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AsignacionRolServicio_planId_orden_idx" ON "AsignacionRolServicio"("planId", "orden");
CREATE INDEX "AsignacionRolServicio_aspiranteId_idx" ON "AsignacionRolServicio"("aspiranteId");

ALTER TABLE "AsignacionRolServicio"
ADD CONSTRAINT "AsignacionRolServicio_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "PlanRolServicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AsignacionRolServicio"
ADD CONSTRAINT "AsignacionRolServicio_aspiranteId_fkey"
FOREIGN KEY ("aspiranteId") REFERENCES "Aspirante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
