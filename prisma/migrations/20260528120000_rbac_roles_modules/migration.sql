-- RBAC: módulos, permisos, roles y migración desde UserRole enum

CREATE TABLE "AuthModule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthModule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthModule_key_key" ON "AuthModule"("key");

CREATE TABLE "AuthPermission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "AuthPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthPermission_key_key" ON "AuthPermission"("key");
CREATE INDEX "AuthPermission_moduleId_idx" ON "AuthPermission"("moduleId");

CREATE TABLE "AuthRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "assignable" BOOLEAN NOT NULL DEFAULT true,
    "isSuper" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthRole_key_key" ON "AuthRole"("key");

CREATE TABLE "AuthRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "AuthRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

ALTER TABLE "AuthPermission" ADD CONSTRAINT "AuthPermission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AuthModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthRolePermission" ADD CONSTRAINT "AuthRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AuthRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthRolePermission" ADD CONSTRAINT "AuthRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "AuthPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Roles del sistema (ids fijos para migración de usuarios)
INSERT INTO "AuthRole" ("id", "key", "label", "description", "isSystem", "assignable", "isSuper", "sortOrder", "updatedAt") VALUES
('authrole_super_admin', 'SUPER_ADMIN', 'Super administrador', 'Acceso total; solo asignable por seed o base de datos.', true, false, true, 0, CURRENT_TIMESTAMP),
('authrole_admin', 'ADMIN', 'Administrador', 'Gestión operativa y de usuarios (sin super administradores).', true, true, false, 10, CURRENT_TIMESTAMP),
('authrole_operador', 'OPERADOR', 'Operador', 'Registro y edición de aspirantes, efemérides y esquelas.', true, true, false, 20, CURRENT_TIMESTAMP),
('authrole_consulta', 'CONSULTA', 'Solo consulta', 'Lectura del censo y panel principal.', true, true, false, 30, CURRENT_TIMESTAMP);

ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

UPDATE "User" SET "roleId" = CASE "role"::text
    WHEN 'SUPER_ADMIN' THEN 'authrole_super_admin'
    WHEN 'ADMIN' THEN 'authrole_admin'
    WHEN 'OPERADOR' THEN 'authrole_operador'
    ELSE 'authrole_consulta'
END;

UPDATE "User" SET "roleId" = 'authrole_operador' WHERE "roleId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

CREATE INDEX "User_roleId_idx" ON "User"("roleId");

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AuthRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" DROP COLUMN "role";

DROP TYPE "UserRole";
