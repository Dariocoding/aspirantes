-- Unificar inventario de cocina en rancho (misma área operativa)

UPDATE "InventarioItem" c

SET nombre = c.nombre || ' (cocina)'

WHERE c.area = 'COCINA'

  AND EXISTS (

    SELECT 1 FROM "InventarioItem" r

    WHERE r.area = 'RANCHO' AND r.nombre = c.nombre

  );



UPDATE "InventarioItem" SET area = 'RANCHO' WHERE area = 'COCINA';



ALTER TYPE "AreaInventario" RENAME TO "AreaInventario_old";

CREATE TYPE "AreaInventario" AS ENUM ('RANCHO');

ALTER TABLE "InventarioItem" ALTER COLUMN area TYPE "AreaInventario" USING area::text::"AreaInventario";

DROP TYPE "AreaInventario_old";

