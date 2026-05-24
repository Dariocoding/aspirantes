import type { UserRole } from "@/generated/prisma";

/**
 * Permisos atómicos del sistema. Los roles se mapean a subconjuntos en `rolePermissions`.
 * Ampliar aquí y en el mapa cuando aparezcan nuevos módulos o acciones sensibles.
 */
export const Permission = {
  DASHBOARD_READ: "dashboard.read",
  ASPIRANTES_READ: "aspirantes.read",
  ASPIRANTES_WRITE: "aspirantes.write",
  CONVOCATORIAS_MANAGE: "convocatorias.manage",
  EFEMERIDES_WRITE: "efemerides.write",
  ESQUELAS_WRITE: "esquelas.write",
  USERS_READ: "users.read",
  /** Alta y edición de usuarios (no incluye rol super ni tocar cuentas super). */
  USERS_MANAGE: "users.manage",
  /** Asignar SUPER_ADMIN y modificar cuentas con ese rol. */
  USERS_SUPER: "users.super",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

const ALL: PermissionKey[] = Object.values(Permission);

const SUPER_ADMIN_SET = new Set<PermissionKey>(ALL);

const ADMIN_SET = new Set<PermissionKey>([
  Permission.DASHBOARD_READ,
  Permission.ASPIRANTES_READ,
  Permission.ASPIRANTES_WRITE,
  Permission.CONVOCATORIAS_MANAGE,
  Permission.EFEMERIDES_WRITE,
  Permission.ESQUELAS_WRITE,
  Permission.USERS_READ,
  Permission.USERS_MANAGE,
  Permission.AUDIT_READ,
]);

const OPERADOR_SET = new Set<PermissionKey>([
  Permission.DASHBOARD_READ,
  Permission.ASPIRANTES_READ,
  Permission.ASPIRANTES_WRITE,
  Permission.EFEMERIDES_WRITE,
  Permission.ESQUELAS_WRITE,
]);

const CONSULTA_SET = new Set<PermissionKey>([
  Permission.DASHBOARD_READ,
  Permission.ASPIRANTES_READ,
]);

const byRole: Record<UserRole, ReadonlySet<PermissionKey>> = {
  SUPER_ADMIN: SUPER_ADMIN_SET,
  ADMIN: ADMIN_SET,
  OPERADOR: OPERADOR_SET,
  CONSULTA: CONSULTA_SET,
};

export function hasPermission(role: UserRole, key: PermissionKey): boolean {
  return byRole[role]?.has(key) ?? false;
}

export function listPermissions(role: UserRole): PermissionKey[] {
  return Array.from(byRole[role] ?? []);
}
