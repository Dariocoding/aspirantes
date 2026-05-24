-- Elimina filas duplicadas (misma fecha y nombre); conserva el registro con id lexicográficamente menor.
DELETE FROM "Efemeride" a
WHERE EXISTS (
  SELECT 1
  FROM "Efemeride" b
  WHERE b."dia" = a."dia"
    AND b."mes" = a."mes"
    AND b."nombre" = a."nombre"
    AND b."id" < a."id"
);

-- Evita nuevos duplicados y permite usar skipDuplicates en createMany.
CREATE UNIQUE INDEX "Efemeride_dia_mes_nombre_key" ON "Efemeride"("dia", "mes", "nombre");
