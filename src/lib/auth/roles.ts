import type { AuthContext } from "@src/lib/auth/session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";

export function canWrite(ctx: AuthContext): boolean {
  return hasPermission(ctx, Permission.ASPIRANTES_WRITE);
}

/** Acceso a convocatorias, usuarios, auditoría y enlaces de administración en UI. */
export function isAdmin(ctx: AuthContext): boolean {
  return (
    hasPermission(ctx, Permission.USERS_READ) ||
    hasPermission(ctx, Permission.AUDIT_READ) ||
    hasPermission(ctx, Permission.CONVOCATORIAS_MANAGE) ||
    hasPermission(ctx, Permission.ROLES_READ)
  );
}

export function userRoleLabel(label: string): string {
  return label;
}
