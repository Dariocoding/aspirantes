-- Datos de ambos padres, patrimonio, carnet de la patria y cuenta nómina BANFANB.
ALTER TABLE "Aspirante" ADD COLUMN "madreFechaNacimiento" TIMESTAMP(3);
ALTER TABLE "Aspirante" ADD COLUMN "padreNombres" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "padreApellidos" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "padreCedula" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "padreFechaNacimiento" TIMESTAMP(3);
ALTER TABLE "Aspirante" ADD COLUMN "poseeVehiculoPropio" BOOLEAN;
ALTER TABLE "Aspirante" ADD COLUMN "poseeViviendaPropia" BOOLEAN;
ALTER TABLE "Aspirante" ADD COLUMN "carnetPatriaSerial" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "carnetPatriaCodigo" TEXT;
ALTER TABLE "Aspirante" ADD COLUMN "cuentaNominaBanfanb" TEXT;
