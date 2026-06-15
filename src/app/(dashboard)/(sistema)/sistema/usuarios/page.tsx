import { auth } from "@src/auth";

import { UsuariosView } from "@dashboard/usuarios/_components/usuarios-view";

import { authContextFromSession } from "@src/lib/auth/from-session";

import { hasPermission, Permission } from "@src/lib/auth/permissions";

import { getAssignableRoles } from "@src/lib/auth/rbac";

import { prisma } from "@src/lib/prisma";

import { redirect, unauthorized } from "next/navigation";

export default async function UsuariosPage() {
  const session = await auth();

  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);

  if (!hasPermission(ctx, Permission.USERS_READ)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },

    select: {
      id: true,

      email: true,

      name: true,

      active: true,

      roleId: true,

      authRole: { select: { id: true, label: true, key: true, isSuper: true } },
    },
  });

  const assignableRoles = await getAssignableRoles(ctx);

  return (
    <UsuariosView
      users={users.map((u) => ({
        id: u.id,

        email: u.email,

        name: u.name,

        active: u.active,

        roleId: u.roleId,

        roleLabel: u.authRole.label,

        roleKey: u.authRole.key,

        roleIsSuper: u.authRole.isSuper,
      }))}
      currentUserId={session.user.id}
      currentUserRoleIsSuper={ctx.isSuper}
      canManageUsers={hasPermission(ctx, Permission.USERS_MANAGE)}
      assignableRoles={assignableRoles}
    />
  );
}
