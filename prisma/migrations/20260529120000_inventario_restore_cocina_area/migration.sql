-- Restaura COCINA en bases que aplicaron la versión anterior de unify (solo RANCHO).
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
