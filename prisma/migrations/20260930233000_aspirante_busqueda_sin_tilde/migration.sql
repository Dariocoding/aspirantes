-- Columnas de búsqueda sin tildes. El trigger las mantiene al crear o cambiar el nombre.
ALTER TABLE "Aspirante" ADD COLUMN "nombresBusqueda" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Aspirante" ADD COLUMN "apellidosBusqueda" TEXT NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION aspirante_busqueda_fold()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."nombresBusqueda" := translate(
    lower(COALESCE(NEW."nombres", '')),
    'áàäâéèëêíìïîóòöôúùüûñ',
    'aaaaeeeeiiiioooouuuun'
  );
  NEW."apellidosBusqueda" := translate(
    lower(COALESCE(NEW."apellidos", '')),
    'áàäâéèëêíìïîóòöôúùüûñ',
    'aaaaeeeeiiiioooouuuun'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Aspirante_busqueda_fold"
BEFORE INSERT OR UPDATE OF "nombres", "apellidos"
ON "Aspirante"
FOR EACH ROW
EXECUTE FUNCTION aspirante_busqueda_fold();

UPDATE "Aspirante"
SET "nombres" = "nombres";
