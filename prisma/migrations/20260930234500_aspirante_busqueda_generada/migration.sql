-- La columna de búsqueda la calcula Postgres. No depende de un trigger ni de la app.
DROP TRIGGER IF EXISTS "Aspirante_busqueda_fold" ON "Aspirante";
DROP FUNCTION IF EXISTS aspirante_busqueda_fold();

ALTER TABLE "Aspirante" DROP COLUMN IF EXISTS "nombresBusqueda";
ALTER TABLE "Aspirante" DROP COLUMN IF EXISTS "apellidosBusqueda";

CREATE OR REPLACE FUNCTION fold_busqueda(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT translate(
    normalize(COALESCE(t, ''), NFC),
    'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ',
    'abcdefghijklmnopqrstuvwxyzaaaaeeeeiiiioooouuuunaaaaeeeeiiiioooouuuun'
  );
$$;

ALTER TABLE "Aspirante"
  ADD COLUMN "nombresBusqueda" TEXT GENERATED ALWAYS AS (fold_busqueda("nombres")) STORED,
  ADD COLUMN "apellidosBusqueda" TEXT GENERATED ALWAYS AS (fold_busqueda("apellidos")) STORED;
