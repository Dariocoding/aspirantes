import { auth } from "@src/auth";
import { RolesPermisosView } from "@dashboard/sistema/roles/_components/roles-permisos-view";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { redirect, unauthorized } from "next/navigation";

export default async function RolesPermisosPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ROLES_READ)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const canManageRoles = hasPermission(ctx, Permission.ROLES_MANAGE);
  const canManageModules = hasPermission(ctx, Permission.MODULES_MANAGE);

  const [modules, roles] = await Promise.all([
    prisma.authModule.findMany({
      orderBy: [{ appId: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
      include: {
        permissions: { orderBy: { key: "asc" } },
      },
    }),
    prisma.authRole.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: {
        permissions: { select: { permissionId: true } },
        _count: { select: { users: true } },
      },
    }),
  ]);

  return (
    <RolesPermisosView
      modules={modules.map((m) => ({
        id: m.id,
        key: m.key,
        label: m.label,
        description: m.description,
        appId: m.appId === "sistema" ? "sistema" : "personal",
        sortOrder: m.sortOrder,
        permissions: m.permissions.map((p) => ({
          id: p.id,
          key: p.key,
          label: p.label,
          description: p.description,
        })),
      }))}
      roles={roles.map((r) => ({
        id: r.id,
        key: r.key,
        label: r.label,
        description: r.description,
        isSystem: r.isSystem,
        isSuper: r.isSuper,
        assignable: r.assignable,
        sortOrder: r.sortOrder,
        userCount: r._count.users,
        permissionIds: r.permissions.map((p) => p.permissionId),
      }))}
      canManageRoles={canManageRoles}
      canManageModules={canManageModules}
    />
  );
}
