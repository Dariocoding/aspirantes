-- Limpiar Bachiller: el flujo solo admite TSU o superior.
UPDATE "Aspirante"
SET "tipoEstudio" = NULL
WHERE "tipoEstudio" = 'BACHILLER';
