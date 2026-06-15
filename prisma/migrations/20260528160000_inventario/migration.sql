-- CreateEnum
CREATE TYPE "AreaInventario" AS ENUM ('RANCHO', 'COCINA');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateTable
CREATE TABLE "InventarioItem" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "area" "AreaInventario" NOT NULL,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventarioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioMovimiento" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "tipo" "TipoMovimientoInventario" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "notas" TEXT,
    "stockAntes" DOUBLE PRECISION NOT NULL,
    "stockDespues" DOUBLE PRECISION NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventarioMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventarioItem_area_idx" ON "InventarioItem"("area");

-- CreateIndex
CREATE INDEX "InventarioItem_activo_idx" ON "InventarioItem"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "InventarioItem_nombre_area_key" ON "InventarioItem"("nombre", "area");

-- CreateIndex
CREATE INDEX "InventarioMovimiento_itemId_idx" ON "InventarioMovimiento"("itemId");

-- CreateIndex
CREATE INDEX "InventarioMovimiento_createdAt_idx" ON "InventarioMovimiento"("createdAt");

-- AddForeignKey
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventarioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioMovimiento" ADD CONSTRAINT "InventarioMovimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
