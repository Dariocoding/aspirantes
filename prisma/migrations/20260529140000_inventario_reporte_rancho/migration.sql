-- CreateEnum
CREATE TYPE "EstadoReporteInventario" AS ENUM ('QUEDA', 'FALTA', 'NO_HAY');

-- CreateTable
CREATE TABLE "InventarioReporteRancho" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "notas" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventarioReporteRancho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioReporteRanchoLinea" (
    "id" TEXT NOT NULL,
    "reporteId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "stockMinimo" DOUBLE PRECISION,
    "stockReportado" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoReporteInventario" NOT NULL,

    CONSTRAINT "InventarioReporteRanchoLinea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventarioReporteRancho_fecha_key" ON "InventarioReporteRancho"("fecha");

-- CreateIndex
CREATE INDEX "InventarioReporteRancho_fecha_idx" ON "InventarioReporteRancho"("fecha");

-- CreateIndex
CREATE INDEX "InventarioReporteRanchoLinea_reporteId_idx" ON "InventarioReporteRanchoLinea"("reporteId");

-- CreateIndex
CREATE INDEX "InventarioReporteRanchoLinea_estado_idx" ON "InventarioReporteRanchoLinea"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "InventarioReporteRanchoLinea_reporteId_itemId_key" ON "InventarioReporteRanchoLinea"("reporteId", "itemId");

-- AddForeignKey
ALTER TABLE "InventarioReporteRancho" ADD CONSTRAINT "InventarioReporteRancho_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioReporteRanchoLinea" ADD CONSTRAINT "InventarioReporteRanchoLinea_reporteId_fkey" FOREIGN KEY ("reporteId") REFERENCES "InventarioReporteRancho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioReporteRanchoLinea" ADD CONSTRAINT "InventarioReporteRanchoLinea_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventarioItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
