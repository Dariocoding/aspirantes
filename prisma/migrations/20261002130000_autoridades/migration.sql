-- CreateEnum
CREATE TYPE "JerarquiaAutoridad" AS ENUM ('TENIENTE', 'PRIMER_TENIENTE', 'CAPITAN', 'MAYOR', 'TENIENTE_CORONEL', 'CORONEL');

-- CreateTable
CREATE TABLE "Autoridad" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "cedula" TEXT,
    "telefono" TEXT,
    "correo" TEXT,
    "jerarquia" "JerarquiaAutoridad" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Autoridad_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AsignacionRolServicio" ADD COLUMN "autoridadId" TEXT;

-- CreateIndex
CREATE INDEX "Autoridad_activa_idx" ON "Autoridad"("activa");
CREATE INDEX "Autoridad_jerarquia_idx" ON "Autoridad"("jerarquia");
CREATE INDEX "AsignacionRolServicio_autoridadId_idx" ON "AsignacionRolServicio"("autoridadId");

-- AddForeignKey
ALTER TABLE "AsignacionRolServicio" ADD CONSTRAINT "AsignacionRolServicio_autoridadId_fkey" FOREIGN KEY ("autoridadId") REFERENCES "Autoridad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
