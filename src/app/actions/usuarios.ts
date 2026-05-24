"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { canAssignUserRole, canManageUserWithRole } from "@/lib/auth/roles";
import { usuarioActiveSchema, usuarioCreateSchema, usuarioRoleSchema } from "@/lib/validators/usuario";
import { zodFieldErrors } from "@/lib/zod-errors";
import type { UsuarioActionState } from "@/lib/action-types";

const SIN_PERMISO_ADMIN = "/sin-permiso?motivo=administracion";

export async function createUsuario(
  _prev: UsuarioActionState,
  formData: FormData,
): Promise<UsuarioActionState> {
  const session = await requireAdmin();

  const raw = {
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  };

  const parsed = usuarioCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  if (!canAssignUserRole(session.user.role, d.role)) {
    redirect(SIN_PERMISO_ADMIN);
  }

  const passwordHash = await hash(d.password, 12);

  try {
    await prisma.user.create({
      data: {
        email: d.email,
        name: d.name,
        passwordHash,
        role: d.role,
      },
    });
  } catch {
    return { ok: false, errors: { email: "Ya existe un usuario con ese correo" } };
  }

  revalidatePath("/usuarios");
  return { ok: true, errors: {} };
}

export async function updateUsuarioRole(formData: FormData) {
  const session = await requireAdmin();
  const raw = {
    userId: formData.get("userId"),
    role: formData.get("role"),
  };
  const parsed = usuarioRoleSchema.safeParse(raw);
  if (!parsed.success) return;

  if (parsed.data.userId === session.user.id) return;

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true },
  });
  if (!target) return;

  if (!canManageUserWithRole(session.user.role, target.role)) {
    redirect(SIN_PERMISO_ADMIN);
  }
  if (!canAssignUserRole(session.user.role, parsed.data.role)) {
    redirect(SIN_PERMISO_ADMIN);
  }

  if (target.role === "SUPER_ADMIN" && parsed.data.role !== "SUPER_ADMIN") {
    const superCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (superCount <= 1) return;
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  revalidatePath("/usuarios");
}

export async function updateUsuarioActive(formData: FormData) {
  const session = await requireAdmin();
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
    select: { role: true, active: true },
  });
  if (!target) return;

  if (!canManageUserWithRole(session.user.role, target.role)) {
    redirect(SIN_PERMISO_ADMIN);
  }

  if (!parsed.data.active && target.role === "SUPER_ADMIN") {
    const otherActiveSupers = await prisma.user.count({
      where: { role: "SUPER_ADMIN", active: true, id: { not: parsed.data.userId } },
    });
    if (otherActiveSupers === 0) return;
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { active: parsed.data.active },
  });
  revalidatePath("/usuarios");
}
