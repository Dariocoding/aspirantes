"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@src/lib/prisma";
import { requireWriter } from "@src/lib/auth/guards";
import { routes } from "@src/lib/apps/routes";
import { writeAuditLog } from "@src/lib/audit/log";
import { rangesOverlap } from "@src/lib/permisos";
import type { PermisoActionState } from "@src/lib/action-types";
import { permisoAnularSchema, permisoCreateSchema, permisoSeleccionSchema, permisoUpdateSchema } from "@src/lib/validators/permiso";
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

export type PermisoSeleccionResult = {
  ok: boolean;
  errors: Record<string, string>;
  created: number;
  omitted: { id: string; nombre: string; reason: string }[];
};

export async function createPermisosSeleccion(formData: FormData): Promise<PermisoSeleccionResult> {
  const session = await requireWriter();
  const parsed = permisoSeleccionSchema.safeParse({
    aspiranteIds: formData.getAll("aspiranteId").map((value) => String(value)),
    tipo: formData.get("tipo"),
    fechaInicio: formData.get("fechaInicio"),
    fechaFin: formData.get("fechaFin"),
    motivo: formData.get("motivo"),
    destino: formData.get("destino") || "",
    autorizadoPor: formData.get("autorizadoPor") || "",
    observaciones: formData.get("observaciones") || "",
  });
  if (!parsed.success) return { ok: false, errors: zodFieldErrors(parsed.error), created: 0, omitted: [] };

  const d = parsed.data;
  const ids = [...new Set(d.aspiranteIds)];
  const aspirantes = await prisma.aspirante.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombres: true, apellidos: true, cedula: true },
  });
  const byId = new Map(aspirantes.map((a) => [a.id, a]));
  const omitted: PermisoSeleccionResult["omitted"] = [];
  for (const id of ids) {
    if (!byId.has(id)) {
      omitted.push({ id, nombre: id, reason: "Ya no está en el censo." });
    }
  }

  const vigentes = await prisma.permisoPersonal.findMany({
    where: {
      aspiranteId: { in: [...byId.keys()] },
      anulado: false,
      fechaInicio: { lte: d.fechaFinDate },
      fechaFin: { gte: d.fechaInicioDate },
    },
    select: { aspiranteId: true, fechaInicio: true, fechaFin: true },
  });
  const blocked = new Set<string>();
  for (const row of vigentes) {
    if (!rangesOverlap(d.fechaInicioDate, d.fechaFinDate, row.fechaInicio, row.fechaFin)) continue;
    if (blocked.has(row.aspiranteId)) continue;
    blocked.add(row.aspiranteId);
    const person = byId.get(row.aspiranteId);
    const nombre = person ? `${person.nombres} ${person.apellidos}`.trim() : row.aspiranteId;
    omitted.push({
      id: row.aspiranteId,
      nombre,
      reason: "Ya tiene otro permiso en ese intervalo.",
    });
  }

  const eligible = [...byId.keys()].filter((id) => !blocked.has(id));
  if (!eligible.length) {
    return {
      ok: false,
      errors: { _form: "Ningún seleccionado pudo recibir el permiso." },
      created: 0,
      omitted,
    };
  }

  const createdRows = await prisma.$transaction(
    eligible.map((aspiranteId) =>
      prisma.permisoPersonal.create({
        data: {
          aspiranteId,
          tipo: d.tipo,
          fechaInicio: d.fechaInicioDate,
          fechaFin: d.fechaFinDate,
          motivo: d.motivo,
          destino: d.destino,
          autorizadoPor: d.autorizadoPor,
          observaciones: d.observaciones,
        },
      }),
    ),
  );

  await Promise.all(
    createdRows.map((created) =>
      writeAuditLog({
        userId: session.user?.id,
        userEmail: session.user?.email,
        action: "PERMISO_CREATE",
        entityType: "PERMISO",
        entityId: created.id,
        metadata: { aspiranteId: created.aspiranteId, tipo: d.tipo, seleccion: true },
      }),
    ),
  );

  revalidatePermisos();
  for (const aspiranteId of eligible) revalidatePath(routes.personal.aspirante(aspiranteId));
  return { ok: true, errors: {}, created: createdRows.length, omitted };
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
