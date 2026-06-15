import { prisma } from "@src/lib/prisma";
import type { AuthContext } from "@src/lib/auth/session";
import { hasPermissionInContext } from "@src/lib/auth/session";
import { Permission } from "@src/lib/auth/permissions";

export type AuthRoleSummary = {
  id: string;
  key: string;
  label: string;
  isSuper: boolean;
  assignable: boolean;
};

export async function loadAuthContextForUser(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      authRole: {
        select: {
          key: true,
          label: true,
          isSuper: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  });
  if (!user) return null;

  const { authRole } = user;
  return {
    roleId: user.roleId,
    roleKey: authRole.key,
    roleLabel: authRole.label,
    isSuper: authRole.isSuper,
    permissions: authRole.permissions.map((rp) => rp.permission.key),
  };
}

export async function getAssignableRoles(actor: AuthContext): Promise<AuthRoleSummary[]> {
  if (!hasPermissionInContext(actor, Permission.USERS_MANAGE)) return [];

  return prisma.authRole.findMany({
    where: { assignable: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: { id: true, key: true, label: true, isSuper: true, assignable: true },
  });
}

export function canManageUser(actor: AuthContext, target: { isSuper: boolean }): boolean {
  if (!hasPermissionInContext(actor, Permission.USERS_MANAGE)) return false;
  if (target.isSuper && !actor.isSuper) return false;
  return true;
}

export function canAssignRole(actor: AuthContext, role: { assignable: boolean; isSuper: boolean }): boolean {
  if (!hasPermissionInContext(actor, Permission.USERS_MANAGE)) return false;
  if (!role.assignable || role.isSuper) return false;
  return true;
}

export async function getRoleById(roleId: string) {
  return prisma.authRole.findUnique({
    where: { id: roleId },
    select: { id: true, key: true, label: true, isSuper: true, assignable: true, isSystem: true },
  });
}
