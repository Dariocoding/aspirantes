-- Remove inventory module: tables, enums, and RBAC leftovers.

-- Report lines first (FKs to report + items)
DROP TABLE IF EXISTS "InventarioReporteRanchoLinea";

-- Daily ranch reports
DROP TABLE IF EXISTS "InventarioReporteRancho";

-- Stock movements (FK to items + users)
DROP TABLE IF EXISTS "InventarioMovimiento";

-- Inventory items
DROP TABLE IF EXISTS "InventarioItem";

DROP TYPE IF EXISTS "EstadoReporteInventario";
DROP TYPE IF EXISTS "TipoMovimientoInventario";
DROP TYPE IF EXISTS "AreaInventario";

-- RBAC: inventory modules/permissions (cascades to AuthPermission + AuthRolePermission)
DELETE FROM "AuthModule"
WHERE key LIKE 'inventario%'
   OR "appId" = 'inventario';

-- Optional audit trail for inventory actions
DELETE FROM "AuditLog"
WHERE "entityType" IN ('INVENTARIO_ITEM', 'InventarioReporteRancho')
   OR "action" LIKE 'INVENTARIO_%'
   OR "action" LIKE 'inventario.%';
