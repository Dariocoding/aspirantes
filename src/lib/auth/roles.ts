import type { UserRole } from "@/generated/prisma";
import { hasPermission, Permission } from "@/lib/auth/permissions";

export function canWrite(role: UserRole) {
  return role !== "CONSULTA";
}

/** Acceso a convocatorias, usuarios, auditoría y enlaces de administración en UI. */
export function isAdmin(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function userRoleLabel(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super administrador";
    case "ADMIN":
      return "Administrador";
    case "OPERADOR":
      return "Operador";
    case "CONSULTA":
      return "Solo consulta";
    default:
      return role;
  }
}

/** Roles que el actor puede asignar al crear o editar cuentas. */
export function assignableUserRoles(actor: UserRole): UserRole[] {
  if (actor === "SUPER_ADMIN") return ["SUPER_ADMIN", "ADMIN", "OPERADOR", "CONSULTA"];
  if (actor === "ADMIN") return ["ADMIN", "OPERADOR", "CONSULTA"];
  return [];
}

export function canAssignUserRole(actor: UserRole, targetRole: UserRole): boolean {
  return assignableUserRoles(actor).includes(targetRole);
}

/**
 * Puede gestionar rol/activo de un usuario con `targetRole` (no aplica a la propia fila).
 * Un administrador normal no puede tocar cuentas super administrador.
 */
export function canManageUserWithRole(actor: UserRole, targetRole: UserRole): boolean {
  if (!hasPermission(actor, Permission.USERS_MANAGE)) return false;
  if (targetRole === "SUPER_ADMIN" && !hasPermission(actor, Permission.USERS_SUPER)) return false;
  return true;
}
