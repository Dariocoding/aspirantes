import type { AuthContext } from "@src/lib/auth/session";

/**
 * Permisos atómicos del sistema. Las claves se sincronizan con `rbac-catalog` y la base de datos.
 */
export const Permission = {
  DASHBOARD_READ: "dashboard.read",
  ASPIRANTES_READ: "aspirantes.read",
  ASPIRANTES_WRITE: "aspirantes.write",
  CONVOCATORIAS_MANAGE: "convocatorias.manage",
  EFEMERIDES_WRITE: "efemerides.write",
  ESQUELAS_WRITE: "esquelas.write",
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  USERS_SUPER: "users.super",
  AUDIT_READ: "audit.read",
  ROLES_READ: "roles.read",
  ROLES_MANAGE: "roles.manage",
  MODULES_MANAGE: "modules.manage",
  INVENTARIO_RANCHO_READ: "inventario.rancho.read",
  INVENTARIO_RANCHO_WRITE: "inventario.rancho.write",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

export function hasPermission(ctx: AuthContext, key: PermissionKey | string): boolean {
  if (ctx.isSuper) return true;
  return ctx.permissions.includes(key);
}

export function listPermissions(ctx: AuthContext): string[] {
  if (ctx.isSuper) return Object.values(Permission);
  return [...ctx.permissions];
}
