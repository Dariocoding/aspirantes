-- Agrupa módulos RBAC por aplicación del portal (personal | sistema)

ALTER TABLE "AuthModule" ADD COLUMN "appId" TEXT NOT NULL DEFAULT 'personal';

UPDATE "AuthModule" SET "appId" = 'sistema' WHERE "key" IN ('users', 'audit', 'rbac');

CREATE INDEX "AuthModule_appId_idx" ON "AuthModule"("appId");
