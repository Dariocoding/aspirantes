/*
  Warnings:

  - The values [COCINA] on the enum `AreaInventario` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AreaInventario_new" AS ENUM ('RANCHO');
ALTER TABLE "InventarioItem" ALTER COLUMN "area" TYPE "AreaInventario_new" USING ("area"::text::"AreaInventario_new");
ALTER TYPE "AreaInventario" RENAME TO "AreaInventario_old";
ALTER TYPE "AreaInventario_new" RENAME TO "AreaInventario";
DROP TYPE "public"."AreaInventario_old";
COMMIT;
