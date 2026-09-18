-- Tallas de uniforme, padres venezolanos y datos de la madre.
CREATE TYPE "TallaUniformePatriota" AS ENUM ('XSS', 'SS', 'SR', 'SL', 'MS', 'MR', 'ML', 'LR', 'XL', 'XLR', 'XXL');
CREATE TYPE "TallaUniformeOliva" AS ENUM (
  'FEM_8_10', 'FEM_10_12', 'FEM_12_14', 'FEM_14_16', 'FEM_16_18', 'FEM_18_20',
  'MAS_28_30', 'MAS_30_32', 'MAS_32_34', 'MAS_34_36', 'MAS_36_38', 'MAS_38_40'
);

ALTER TABLE "Aspirante" ADD COLUMN "padresVenezolanos" BOOLEAN;
ALTER TABLE "Aspirante" ADD COLUMN "madreNombres" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "madreApellidos" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "madreCedula" TEXT;

ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "tallaUniformePatriota" "TallaUniformePatriota";
ALTER TABLE "DatosFisicosMedicos" ADD COLUMN "tallaUniformeOliva" "TallaUniformeOliva";
