"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@src/lib/prisma";
import { requireWriter } from "@src/lib/auth/guards";
import { routes } from "@src/lib/apps/routes";
import { writeAuditLog } from "@src/lib/audit/log";
import { rangesOverlap } from "@src/lib/permisos";
import type { PermisoActionState } from "@src/lib/action-types";
import { permisoAnularSchema, permisoCreateSchema, permisoUpdateSchema } from "@src/lib/validators/permiso";
import { zodFieldErrors } from "@src/lib/zod-errors";

function revalidatePermisos(aspiranteId?: string) {
  revalidatePath(routes.personal.permisos);
  revalidatePath(routes.personal.home);
  if (aspiranteId) revalidatePath(routes.personal.aspirante(aspiranteId));
}

async function overlappingPermiso(params: {
  aspiranteId: string;
  inicio: Date;
  fin: Date;
  excludeId?: string;
}) {
  const rows = await prisma.permisoPersonal.findMany({
    where: {
      aspiranteId: params.aspiranteId,
      anulado: false,
      ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      fechaInicio: { lte: params.fin },
      fechaFin: { gte: params.inicio },
    },
    select: { id: true, fechaInicio: true, fechaFin: true },
  });
  return rows.find((r) => rangesOverlap(params.inicio, params.fin, r.fechaInicio, r.fechaFin)) ?? null;
}

export async function createPermisoPersonal(
  _prev: PermisoActionState,
  formData: FormData,
): Promise<PermisoActionState> {
  const session = await requireWriter();

  const parsed = permisoCreateSchema.safeParse({
    aspiranteId: formData.get("aspiranteId"),
    tipo: formData.get("tipo"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: formData.get("fechaFin"),
    motivo: formData.get("motivo"),
    destino: formData.get("destino") || "",
    autorizadoPor: formData.get("autorizadoPor") || "",
    observaciones: formData.get("observaciones") || "",
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const overlap = await overlappingPermiso({
    aspiranteId: d.aspiranteId,
    inicio: d.fechaInicioDate,
    fin: d.fechaFinDate,
  });
  if (overlap) {
    return {
      ok: false,
      errors: { fechaInicio: "Ya tiene otro permiso en ese intervalo. Edite o anule el existente." },
    };
  }

  const created = await prisma.permisoPersonal.create({
    data: {
      aspiranteId: d.aspiranteId,
      tipo: d.tipo,
      fechaInicio: d.fechaInicioDate,
      fechaFin: d.fechaFinDate,
      motivo: d.motivo,
      destino: d.destino,
      autorizadoPor: d.autorizadoPor,
      observaciones: d.observaciones,
    },
  });

  await writeAuditLog({
    userId: session.user?.id,
    userEmail: session.user?.email,
    action: "PERMISO_CREATE",
    entityType: "PERMISO",
    entityId: created.id,
    metadata: { aspiranteId: d.aspiranteId, tipo: d.tipo },
  });

  revalidatePermisos(d.aspiranteId);
  return { ok: true, errors: {}, id: created.id };
}

export async function updatePermisoPersonal(
  _prev: PermisoActionState,
  formData: FormData,
): Promise<PermisoActionState> {
  const session = await requireWriter();

  const parsed = permisoUpdateSchema.safeParse({
    id: formData.get("id"),
    aspiranteId: formData.get("aspiranteId"),
    tipo: formData.get("tipo"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: formData.get("fechaFin"),
    motivo: formData.get("motivo"),
    destino: formData.get("destino") || "",
    autorizadoPor: formData.get("autorizadoPor") || "",
    observaciones: formData.get("observaciones") || "",
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const d = parsed.data;
  const existing = await prisma.permisoPersonal.findUnique({ where: { id: d.id } });
  if (!existing) return { ok: false, errors: { id: "El permiso no existe." } };
  if (existing.anulado) return { ok: false, errors: { _form: "No se puede editar un permiso anulado." } };

  const overlap = await overlappingPermiso({
    aspiranteId: d.aspiranteId,
    inicio: d.fechaInicioDate,
    fin: d.fechaFinDate,
    excludeId: d.id,
  });
  if (overlap) {
    return {
      ok: false,
      errors: { fechaInicio: "Ya tiene otro permiso en ese intervalo. Edite o anule el existente." },
    };
  }

  await prisma.permisoPersonal.update({
    where: { id: d.id },
    data: {
      aspiranteId: d.aspiranteId,
      tipo: d.tipo,
      fechaInicio: d.fechaInicioDate,
      fechaFin: d.fechaFinDate,
      motivo: d.motivo,
      destino: d.destino,
      autorizadoPor: d.autorizadoPor,
      observaciones: d.observaciones,
    },
  });

  await writeAuditLog({
    userId: session.user?.id,
    userEmail: session.user?.email,
    action: "PERMISO_UPDATE",
    entityType: "PERMISO",
    entityId: d.id,
    metadata: { aspiranteId: d.aspiranteId, tipo: d.tipo },
  });

  revalidatePermisos(d.aspiranteId);
  return { ok: true, errors: {}, id: d.id };
}

export async function anularPermisoPersonal(
  _prev: PermisoActionState,
  formData: FormData,
): Promise<PermisoActionState> {
  const session = await requireWriter();
  const parsed = permisoAnularSchema.safeParse({
    id: formData.get("id"),
    anuladoMotivo: formData.get("anuladoMotivo"),
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error) };

  const existing = await prisma.permisoPersonal.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { ok: false, errors: { id: "El permiso no existe." } };
  if (existing.anulado) return { ok: true, errors: {}, id: existing.id };

  await prisma.permisoPersonal.update({
    where: { id: parsed.data.id },
    data: {
      anulado: true,
      anuladoMotivo: parsed.data.anuladoMotivo,
      anuladoAt: new Date(),
    },
  });

  await writeAuditLog({
    userId: session.user?.id,
    userEmail: session.user?.email,
    action: "PERMISO_ANULAR",
    entityType: "PERMISO",
    entityId: parsed.data.id,
    metadata: { aspiranteId: existing.aspiranteId },
  });

  revalidatePermisos(existing.aspiranteId);
  return { ok: true, errors: {}, id: parsed.data.id };
}
