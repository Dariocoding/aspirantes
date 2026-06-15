import type { AreaInventario } from "@src/generated/prisma";
import type { AuthContext } from "@src/lib/auth/session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { INVENTARIO_AREAS } from "@src/lib/inventario/area";

export function canReadInventarioArea(ctx: AuthContext, area: AreaInventario): boolean {
  return hasPermission(ctx, INVENTARIO_AREAS[area].readPermission);
}

export function canWriteInventarioArea(ctx: AuthContext, area: AreaInventario): boolean {
  return hasPermission(ctx, INVENTARIO_AREAS[area].writePermission);
}

export function canReadInventario(ctx: AuthContext): boolean {
  return (Object.keys(INVENTARIO_AREAS) as AreaInventario[]).some((area) =>
    canReadInventarioArea(ctx, area),
  );
}

export function canWriteInventario(ctx: AuthContext): boolean {
  return (Object.keys(INVENTARIO_AREAS) as AreaInventario[]).some((area) =>
    canWriteInventarioArea(ctx, area),
  );
}

export const INVENTARIO_ACCESS_PERMISSIONS = [
  Permission.INVENTARIO_RANCHO_READ,
] as const;
