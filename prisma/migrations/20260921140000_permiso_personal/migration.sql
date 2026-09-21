-- Control de permisos de ausencia por aspirante (de / hasta).
CREATE TYPE "TipoPermisoPersonal" AS ENUM (
  'SALIDA',
  'PERNOCTA',
  'FIN_DE_SEMANA',
  'MEDICO',
  'COMISION',
  'FAMILIAR',
  'OTRO'
);

CREATE TABLE "PermisoPersonal" (
    "id" TEXT NOT NULL,
    "aspiranteId" TEXT NOT NULL,
    "tipo" "TipoPermisoPersonal" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "destino" TEXT,
    "autorizadoPor" TEXT,
    "observaciones" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "anuladoMotivo" TEXT,
    "anuladoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermisoPersonal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PermisoPersonal_aspiranteId_fechaInicio_idx" ON "PermisoPersonal"("aspiranteId", "fechaInicio");
CREATE INDEX "PermisoPersonal_fechaInicio_fechaFin_idx" ON "PermisoPersonal"("fechaInicio", "fechaFin");
CREATE INDEX "PermisoPersonal_anulado_idx" ON "PermisoPersonal"("anulado");

ALTER TABLE "PermisoPersonal" ADD CONSTRAINT "PermisoPersonal_aspiranteId_fkey" FOREIGN KEY ("aspiranteId") REFERENCES "Aspirante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
