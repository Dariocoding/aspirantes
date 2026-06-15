"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@src/lib/prisma";
import { convocatoriaCreateSchema, convocatoriaUpdateSchema } from "@src/lib/validators/convocatoria";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { requireAdmin } from "@src/lib/auth/guards";
import type { ConvocatoriaActionState } from "@src/lib/convocatoria-action-state";
import { routes } from "@src/lib/apps/routes";
import { writeAuditLog } from "@src/lib/audit/log";

export async function createConvocatoria(
  _prev: ConvocatoriaActionState,
  formData: FormData,
): Promise<ConvocatoriaActionState> {
  const session = await requireAdmin();

  const raw = {
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre"),
    anio: formData.get("anio"),
    marcarActiva: formData.get("marcarActiva"),
  };

  const parsed = convocatoriaCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;
  const marcar = d.marcarActiva === "on";

  let created!: { id: string; codigo: string; nombre: string; activa: boolean };

  try {
    await prisma.$transaction(async (tx) => {
      if (marcar) {
        await tx.convocatoria.updateMany({ data: { activa: false } });
      }
      created = await tx.convocatoria.create({
        data: {
          codigo: d.codigo,
          nombre: d.nombre,
          anio: d.anio,
          activa: marcar,
        },
        select: { id: true, codigo: true, nombre: true, activa: true },
      });
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") {
      return { ok: false, errors: { codigo: "Ese código ya existe. Use otro distintivo." } };
    }
    throw e;
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: marcar ? "CONVOCATORIA_CREATE_ACTIVA" : "CONVOCATORIA_CREATE",
    entityType: "CONVOCATORIA",
    entityId: created.id,
    metadata: { codigo: created.codigo, nombre: created.nombre, anio: d.anio, activa: created.activa },
  });

  revalidatePath(routes.personal.convocatorias);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  revalidatePath(routes.hub);
  revalidatePath(routes.personal.esquelas);
  return { ok: true, errors: {} };
}

export async function updateConvocatoria(
  _prev: ConvocatoriaActionState,
  formData: FormData,
): Promise<ConvocatoriaActionState> {
  const session = await requireAdmin();

  const raw = {
    id: formData.get("id"),
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre"),
    anio: formData.get("anio"),
  };

  const parsed = convocatoriaUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const d = parsed.data;

  try {
    await prisma.convocatoria.update({
      where: { id: d.id },
      data: { codigo: d.codigo, nombre: d.nombre, anio: d.anio },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2002") {
      return { ok: false, errors: { codigo: "Ese código ya existe. Use otro distintivo." } };
    }
    if (code === "P2025") {
      return { ok: false, errors: { _form: "La convocatoria ya no existe." } };
    }
    throw e;
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "CONVOCATORIA_UPDATE",
    entityType: "CONVOCATORIA",
    entityId: d.id,
    metadata: { codigo: d.codigo, nombre: d.nombre, anio: d.anio },
  });

  revalidatePath(routes.personal.convocatorias);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  revalidatePath(routes.hub);
  revalidatePath(routes.personal.esquelas);
  return { ok: true, errors: {} };
}

export async function deleteConvocatoria(
  _prev: ConvocatoriaActionState,
  formData: FormData,
): Promise<ConvocatoriaActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { ok: false, errors: { _form: "Solicitud inválida." } };
  }

  const inscritos = await prisma.aspirante.count({ where: { convocatoriaId: id } });
  if (inscritos > 0) {
    return {
      ok: false,
      errors: {
        _form: `No se puede eliminar: hay ${inscritos} aspirante(s) registrados en esta convocatoria.`,
      },
    };
  }

  const row = await prisma.convocatoria.findUnique({
    where: { id },
    select: { codigo: true, nombre: true, anio: true },
  });
  if (!row) {
    return { ok: false, errors: { _form: "La convocatoria ya no existe." } };
  }

  try {
    await prisma.convocatoria.delete({ where: { id } });
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "P2025") {
      return { ok: false, errors: { _form: "La convocatoria ya no existe." } };
    }
    throw e;
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "CONVOCATORIA_DELETE",
    entityType: "CONVOCATORIA",
    entityId: id,
    metadata: { codigo: row.codigo, nombre: row.nombre, anio: row.anio },
  });

  revalidatePath(routes.personal.convocatorias);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  revalidatePath(routes.hub);
  revalidatePath(routes.personal.esquelas);
  return { ok: true, errors: {} };
}

export async function activarConvocatoria(formData: FormData) {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const conv = await prisma.convocatoria.findUnique({
    where: { id },
    select: { id: true, codigo: true, nombre: true, anio: true },
  });
  if (!conv) return;

  await prisma.$transaction(async (tx) => {
    await tx.convocatoria.updateMany({ data: { activa: false } });
    await tx.convocatoria.update({ where: { id }, data: { activa: true } });
  });

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "CONVOCATORIA_ACTIVAR",
    entityType: "CONVOCATORIA",
    entityId: id,
    metadata: { codigo: conv.codigo, nombre: conv.nombre, anio: conv.anio },
  });

  revalidatePath(routes.personal.convocatorias);
  revalidatePath(routes.personal.aspirantes);
  revalidatePath(routes.personal.aspirantesGestion);
  revalidatePath(routes.hub);
  revalidatePath(routes.personal.esquelas);
}
