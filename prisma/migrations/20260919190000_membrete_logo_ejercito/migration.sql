-- Logo izquierdo del Ejército y C.E.F.O.A. a la derecha en la plantilla por defecto.
ALTER TABLE "Membrete" ALTER COLUMN "logoIzq" SET DEFAULT 'ejercito';
ALTER TABLE "Membrete" ALTER COLUMN "logoDer" SET DEFAULT 'cefoa';

UPDATE "Membrete"
SET "logoIzq" = 'ejercito', "logoDer" = 'cefoa', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'membrete_cefoa45';
