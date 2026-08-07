-- Segunda fase: datos (ADD VALUE no puede usarse en la misma transacción que el UPDATE en PG).
UPDATE "Aspirante"
SET "tipoEstudio" = 'PREGRADO'
WHERE "tipoEstudio" = 'UNIVERSIDAD';
