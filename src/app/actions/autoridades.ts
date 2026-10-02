"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@src/lib/prisma";
import { routes } from "@src/lib/apps/routes";
import { requireWriter } from "@src/lib/auth/guards";
import type { AutoridadActionState } from "@src/lib/action-types";
import { autoridadCreateSchema, autoridadUpdateSchema } from "@src/lib/validators/autoridad";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { revincularRolesServicioMes } from "@src/lib/roles-servicio/revincular";

export async function createAutoridad(
  _prev: AutoridadActionState,
  formData: FormData,
): Promise<AutoridadActionState> {
  await requireWriter();

  const parsed = autoridadCreateSchema.safeParse({
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula") || "",
    telefono: formData.get("telefono") || "",
    correo: formData.get("correo") || "",
    jerarquia: formData.get("jerarquia"),
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  await prisma.autoridad.create({ data: parsed.data });
  await revincularRolesServicioMes();
  revalidatePath(routes.personal.rolesServicio);
  return { ok: true, errors: {} };
}

export async function updateAutoridad(
  _prev: AutoridadActionState,
  formData: FormData,
): Promise<AutoridadActionState> {
  await requireWriter();

  const parsed = autoridadUpdateSchema.safeParse({
    id: formData.get("id"),
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    cedula: formData.get("cedula") || "",
    telefono: formData.get("telefono") || "",
    correo: formData.get("correo") || "",
    jerarquia: formData.get("jerarquia"),
    activa: formData.get("activa"),
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const { id, ...data } = parsed.data;
  await prisma.autoridad.update({ where: { id }, data });
  await revincularRolesServicioMes();
  revalidatePath(routes.personal.rolesServicio);
  return { ok: true, errors: {} };
}

export async function deleteAutoridad(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireWriter();
  if (!id.trim()) return { ok: false, error: "Identificador inválido" };

  await prisma.autoridad.delete({ where: { id } });
  await revincularRolesServicioMes();
  revalidatePath(routes.personal.rolesServicio);
  return { ok: true };
}
