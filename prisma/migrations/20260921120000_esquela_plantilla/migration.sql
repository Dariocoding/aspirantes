-- Plantilla configurable de esquelas (fondo, corona y recuadros).
CREATE TABLE "EsquelaPlantilla" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEsquela" NOT NULL,
    "nombre" TEXT NOT NULL,
    "fondoKey" TEXT,
    "overlayKey" TEXT,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsquelaPlantilla_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EsquelaPlantilla_tipo_key" ON "EsquelaPlantilla"("tipo");
