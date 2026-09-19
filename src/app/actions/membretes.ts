"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@src/lib/prisma";
import { membreteCreateSchema, membreteUpdateSchema } from "@src/lib/validators/membrete";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { requireWriter } from "@src/lib/auth/guards";
import { routes } from "@src/lib/apps/routes";
import type { MembreteActionState } from "@src/lib/action-types";
import { ZodError } from "zod";

function revalidateMembretes() {
  revalidatePath(routes.personal.membretes);
  revalidatePath(routes.personal.aspirantes);
}

export async function createMembrete(
  _prev: MembreteActionState,
  formData: FormData,
): Promise<MembreteActionState> {
  await requireWriter();

  try {
    const parsed = membreteCreateSchema.parse({
      nombre: formData.get("nombre"),
      lineasTexto: formData.get("lineasTexto") || "",
      logoIzq: formData.get("logoIzq") || "none",
      logoDer: formData.get("logoDer") || "none",
      isDefault: formData.get("isDefault"),
    });

    const count = await prisma.membrete.count();
    const isDefault = parsed.isDefault || count === 0;

    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.membrete.updateMany({ data: { isDefault: false } });
      }
      return tx.membrete.create({
        data: {
          nombre: parsed.nombre,
          lineas: parsed.lineas,
          logoIzq: parsed.logoIzq,
          logoDer: parsed.logoDer,
          isDefault,
        },
      });
    });

    revalidateMembretes();
    return { ok: true, errors: {}, id: created.id };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, errors: zodFieldErrors(e) };
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return { ok: false, errors: { nombre: "Ya existe un membrete con ese nombre." } };
    }
    return { ok: false, errors: { _form: "No se pudo guardar el membrete." } };
  }
}

export async function updateMembrete(
  _prev: MembreteActionState,
  formData: FormData,
): Promise<MembreteActionState> {
  await requireWriter();

  try {
    const parsed = membreteUpdateSchema.parse({
      id: formData.get("id"),
      nombre: formData.get("nombre"),
      lineasTexto: formData.get("lineasTexto") || "",
      logoIzq: formData.get("logoIzq") || "none",
      logoDer: formData.get("logoDer") || "none",
      isDefault: formData.get("isDefault"),
    });

    await prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.membrete.updateMany({
          where: { id: { not: parsed.id } },
          data: { isDefault: false },
        });
      }
      await tx.membrete.update({
        where: { id: parsed.id },
        data: {
          nombre: parsed.nombre,
          lineas: parsed.lineas,
          logoIzq: parsed.logoIzq,
          logoDer: parsed.logoDer,
          isDefault: parsed.isDefault,
        },
      });
    });

    revalidateMembretes();
    return { ok: true, errors: {}, id: parsed.id };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, errors: zodFieldErrors(e) };
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return { ok: false, errors: { nombre: "Ya existe un membrete con ese nombre." } };
    }
    return { ok: false, errors: { _form: "No se pudo actualizar el membrete." } };
  }
}

export async function deleteMembrete(formData: FormData) {
  await requireWriter();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.membrete.delete({ where: { id } });
  revalidateMembretes();
}
