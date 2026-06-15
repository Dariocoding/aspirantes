"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@src/lib/prisma";
import { requireAdmin } from "@src/lib/auth/guards";
import { authContextFromSession } from "@src/lib/auth/from-session";
import {
  canAssignRole,
  canManageUser,
  getRoleById,
} from "@src/lib/auth/rbac";
import { SYSTEM_ROLE_IDS } from "@src/lib/auth/rbac-catalog";
import { routes } from "@src/lib/apps/routes";
import { usuarioActiveSchema, usuarioCreateSchema, usuarioRoleSchema } from "@src/lib/validators/usuario";
import { zodFieldErrors } from "@src/lib/zod-errors";
import type { UsuarioActionState } from "@src/lib/action-types";

const SIN_PERMISO_ADMIN = "/sin-permiso?motivo=administracion";

export async function createUsuario(
  _prev: UsuarioActionState,
  formData: FormData,
): Promise<UsuarioActionState> {
  const session = await requireAdmin();
  const actor = authContextFromSession(session);

  const raw = {
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  };

  const parsed = usuarioCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const targetRole = await getRoleById(parsed.data.roleId);
  if (!targetRole || !canAssignRole(actor, targetRole)) {
    redirect(SIN_PERMISO_ADMIN);
  }

  const passwordHash = await hash(parsed.data.password, 12);

  try {
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        roleId: parsed.data.roleId,
      },
    });
  } catch {
    return { ok: false, errors: { email: "Ya existe un usuario con ese correo" } };
  }

  revalidatePath(routes.sistema.usuarios);
  return { ok: true, errors: {} };
}

export async function updateUsuarioRole(formData: FormData) {
  const session = await requireAdmin();
  const actor = authContextFromSession(session);
  const raw = {
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
  };
  const parsed = usuarioRoleSchema.safeParse(raw);
  if (!parsed.success) return;

  if (parsed.data.userId === session.user.id) return;

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      roleId: true,
      authRole: { select: { isSuper: true, assignable: true } },
    },
  });
  if (!target) return;

  const newRole = await getRoleById(parsed.data.roleId);
  if (!newRole) return;

  if (!canManageUser(actor, target.authRole)) {
    redirect(SIN_PERMISO_ADMIN);
  }
  if (!canAssignRole(actor, newRole)) {
    redirect(SIN_PERMISO_ADMIN);
  }

  if (target.authRole.isSuper && !newRole.isSuper) {
    const superCount = await prisma.user.count({
      where: { roleId: SYSTEM_ROLE_IDS.SUPER_ADMIN },
    });
    if (superCount <= 1) return;
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { roleId: parsed.data.roleId },
  });
  revalidatePath(routes.sistema.usuarios);
}

export async function updateUsuarioActive(formData: FormData) {
  const session = await requireAdmin();
  const actor = authContextFromSession(session);
  const raw = {
    userId: formData.get("userId"),
    active: formData.get("active"),
  };
  const parsed = usuarioActiveSchema.safeParse({
    userId: raw.userId,
    active: raw.active === "true" || raw.active === "on" || raw.active === "1",
  });
  if (!parsed.success) return;

  if (parsed.data.userId === session.user.id && !parsed.data.active) return;

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      roleId: true,
      active: true,
      authRole: { select: { isSuper: true } },
    },
  });
  if (!target) return;

  if (!canManageUser(actor, target.authRole)) {
    redirect(SIN_PERMISO_ADMIN);
  }

  if (!parsed.data.active && target.authRole.isSuper) {
    const otherActiveSupers = await prisma.user.count({
      where: {
        roleId: SYSTEM_ROLE_IDS.SUPER_ADMIN,
        active: true,
        id: { not: parsed.data.userId },
      },
    });
    if (otherActiveSupers === 0) return;
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { active: parsed.data.active },
  });
  revalidatePath(routes.sistema.usuarios);
}
