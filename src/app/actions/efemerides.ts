"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { efemerideCreateSchema, efemerideUpdateSchema } from "@/lib/validators/efemeride";
import { zodFieldErrors } from "@/lib/zod-errors";
import { requireWriter } from "@/lib/auth/guards";
import type { EfemerideActionState } from "@/lib/action-types";

export async function createEfemeride(
  _prev: EfemerideActionState,
  formData: FormData,
): Promise<EfemerideActionState> {
  await requireWriter();

  const raw = {
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") || "",
    dia: formData.get("dia"),
    mes: formData.get("mes"),
    tipo: formData.get("tipo") || "",
  };

  const parsed = efemerideCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;

  await prisma.efemeride.create({
    data: {
      nombre: d.nombre,
      descripcion: d.descripcion?.trim() ? d.descripcion.trim() : null,
      dia: d.dia,
      mes: d.mes,
      tipo: d.tipo,
    },
  });

  revalidatePath("/");
  revalidatePath("/efemerides");
  return { ok: true, errors: {} };
}

export async function updateEfemeride(
  _prev: EfemerideActionState,
  formData: FormData,
): Promise<EfemerideActionState> {
  await requireWriter();

  const raw = {
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") || "",
    dia: formData.get("dia"),
    mes: formData.get("mes"),
    tipo: formData.get("tipo") || "",
    activa: formData.get("activa"),
  };

  const parsed = efemerideUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;

  await prisma.efemeride.update({
    where: { id: d.id },
    data: {
      nombre: d.nombre,
      descripcion: d.descripcion?.trim() ? d.descripcion.trim() : null,
      dia: d.dia,
      mes: d.mes,
      tipo: d.tipo,
      activa: d.activa,
    },
  });

  revalidatePath("/");
  revalidatePath("/efemerides");
  return { ok: true, errors: {} };
}

export async function deleteEfemeride(formData: FormData) {
  await requireWriter();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.efemeride.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/efemerides");
}
