-- Añade COCINA solo si aún no existe (p. ej. enum creado solo con RANCHO en algún entorno).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AreaInventario'
      AND e.enumlabel = 'COCINA'
  ) THEN
    ALTER TYPE "AreaInventario" ADD VALUE 'COCINA';
  END IF;
END $$;
