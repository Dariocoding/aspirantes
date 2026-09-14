-- El historial de migraciones vuelve a dejar COCINA (restore), pero el esquema
-- vigente y los datos usan solo RANCHO. Recrea el enum sin perder filas.
UPDATE "InventarioItem" SET area = 'RANCHO' WHERE area::text = 'COCINA';

ALTER TYPE "AreaInventario" RENAME TO "AreaInventario_old";
CREATE TYPE "AreaInventario" AS ENUM ('RANCHO');
ALTER TABLE "InventarioItem" ALTER COLUMN area TYPE "AreaInventario" USING area::text::"AreaInventario";
DROP TYPE "AreaInventario_old";
