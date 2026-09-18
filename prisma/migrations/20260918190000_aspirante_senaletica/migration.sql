-- Rasgos físicos, factor RH, señas particulares y redes sociales.
CREATE TYPE "ColorCabello" AS ENUM ('NEGRO', 'CASTANO_CLARO', 'CASTANO_OSCURO', 'RUBIO', 'ROJIZO', 'CANOSO');
CREATE TYPE "FormaLabios" AS ENUM ('VOLUMINOSOS', 'FINOS', 'GRUESO_EN_EL_CENTRO', 'NORMALES', 'AUMENTADOS');
CREATE TYPE "FormaNariz" AS ENUM ('PEQUENA', 'PERFILADA', 'ANCHA', 'ARQUEADA', 'GRANDE');
CREATE TYPE "ColorOjos" AS ENUM ('CAFE', 'AMBAR', 'AVELLANA', 'VERDE', 'AZUL', 'GRIS', 'NEGRO');
CREATE TYPE "ColorPiel" AS ENUM ('CLARA', 'MORENA', 'MARRON', 'NEGRA');
CREATE TYPE "FactorRh" AS ENUM ('POSITIVO', 'NEGATIVO');
CREATE TYPE "SenaParticular" AS ENUM ('LUNARES', 'CICATRIZ', 'BERRUGA', 'MANCHAS_DE_LA_PIEL', 'LESIONES', 'TATUAJE', 'NINGUNA');

ALTER TABLE "Aspirante" ADD COLUMN "instagram" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "twitter" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "facebook" TEXT;

ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "factorRh" "FactorRh";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "colorCabello" "ColorCabello";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "formaLabios" "FormaLabios";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "formaNariz" "FormaNariz";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "colorOjos" "ColorOjos";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "colorPiel" "ColorPiel";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "senaParticular" "SenaParticular";

UPDATE "DatosFisicosMedicos"
SET "factorRh" = CASE
  WHEN "tipoSangre" ~* '(pos|\+|positivo)' THEN 'POSITIVO'::"FactorRh"
  WHEN "tipoSangre" ~* '(neg|\-|negativo)' THEN 'NEGATIVO'::"FactorRh"
  ELSE "factorRh"
END
WHERE "tipoSangre" IS NOT NULL AND "factorRh" IS NULL;
