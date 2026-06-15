"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@src/lib/apps/routes";
import { prisma } from "@src/lib/prisma";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { requirePermission } from "@src/lib/auth/guards";
import { Permission } from "@src/lib/auth/permissions";
import {
  moduleCreateSchema,
  moduleUpdateSchema,
  permissionCreateSchema,
  roleCreateSchema,
  rolePermissionsSchema,
  roleUpdateSchema,
} from "@src/lib/validators/rbac";

const SIN_PERMISO = "/sin-permiso?motivo=administracion";
const REVALIDATE = [routes.sistema.roles, routes.sistema.usuarios];

function revalidateRbac() {
  for (const path of REVALIDATE) revalidatePath(path);
}

export async function createAuthModule(formData: FormData) {
  const session = await requirePermission(Permission.MODULES_MANAGE);
  const actor = authContextFromSession(session);
  if (!actor.isSuper && !actor.permissions.includes(Permission.MODULES_MANAGE)) {
    redirect(SIN_PERMISO);
  }

  const parsed = moduleCreateSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label"),
    description: formData.get("description"),
    appId: formData.get("appId"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { ok: false as const, message: "Datos inválidos" };

  try {
    await prisma.authModule.create({
      data: {
        key: parsed.data.key,
        label: parsed.data.label,
        description: parsed.data.description || null,
        appId: parsed.data.appId,
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch {
    return { ok: false as const, message: "Ya existe un módulo con esa clave" };
  }

  revalidateRbac();
  return { ok: true as const };
}

export async function updateAuthModule(formData: FormData) {
  await requirePermission(Permission.MODULES_MANAGE);
  const parsed = moduleUpdateSchema.safeParse({
    id: formData.get("id"),
    key: formData.get("key"),
    label: formData.get("label"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return;

  await prisma.authModule.update({
    where: { id: parsed.data.id },
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
    },
  });
  revalidateRbac();
}

export async function createAuthPermission(formData: FormData) {
  await requirePermission(Permission.MODULES_MANAGE);
  const parsed = permissionCreateSchema.safeParse({
    moduleId: formData.get("moduleId"),
    key: formData.get("key"),
    label: formData.get("label"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { ok: false as const, message: "Datos inválidos" };

  try {
    await prisma.authPermission.create({
      data: {
        moduleId: parsed.data.moduleId,
        key: parsed.data.key,
        label: parsed.data.label,
        description: parsed.data.description || null,
      },
    });
  } catch {
    return { ok: false as const, message: "Clave de permiso duplicada" };
  }

  revalidateRbac();
  return { ok: true as const };
}

export async function deleteAuthModule(moduleId: string) {
  await requirePermission(Permission.MODULES_MANAGE);
  const mod = await prisma.authModule.findUnique({
    where: { id: moduleId },
    include: { _count: { select: { permissions: true } } },
  });
  if (!mod) return;
  if (mod._count.permissions > 0) return;

  await prisma.authModule.delete({ where: { id: moduleId } });
  revalidateRbac();
}

export async function createAuthRole(formData: FormData) {
  await requirePermission(Permission.ROLES_MANAGE);
  const parsed = roleCreateSchema.safeParse({
    key: formData.get("key"),
    label: formData.get("label"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { ok: false as const, message: "Datos inválidos" };

  try {
    await prisma.authRole.create({
      data: {
        key: parsed.data.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
        label: parsed.data.label,
        description: parsed.data.description || null,
        sortOrder: parsed.data.sortOrder,
        assignable: true,
        isSystem: false,
        isSuper: false,
      },
    });
  } catch {
    return { ok: false as const, message: "Ya existe un rol con esa clave" };
  }

  revalidateRbac();
  return { ok: true as const };
}

export async function updateAuthRole(formData: FormData) {
  await requirePermission(Permission.ROLES_MANAGE);
  const parsed = roleUpdateSchema.safeParse({
    roleId: formData.get("roleId"),
    label: formData.get("label"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return;

  const role = await prisma.authRole.findUnique({ where: { id: parsed.data.roleId } });
  if (!role || role.isSuper) return;

  await prisma.authRole.update({
    where: { id: parsed.data.roleId },
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
    },
  });
  revalidateRbac();
}

export async function deleteAuthRole(roleId: string) {
  await requirePermission(Permission.ROLES_MANAGE);
  const role = await prisma.authRole.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });
  if (!role || role.isSystem) return;
  if (role._count.users > 0) return;

  await prisma.authRole.delete({ where: { id: roleId } });
  revalidateRbac();
}

export async function setRolePermissions(formData: FormData) {
  await requirePermission(Permission.ROLES_MANAGE);
  const permissionIds = formData.getAll("permissionIds").map(String);
  const parsed = rolePermissionsSchema.safeParse({
    roleId: formData.get("roleId"),
    permissionIds,
  });
  if (!parsed.success) return;

  const role = await prisma.authRole.findUnique({ where: { id: parsed.data.roleId } });
  if (!role || role.isSuper) return;

  await prisma.$transaction([
    prisma.authRolePermission.deleteMany({ where: { roleId: parsed.data.roleId } }),
    prisma.authRolePermission.createMany({
      data: parsed.data.permissionIds.map((permissionId) => ({
        roleId: parsed.data.roleId,
        permissionId,
      })),
      skipDuplicates: true,
    }),
  ]);

  revalidateRbac();
}
