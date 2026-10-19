"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { marcasDesdeJson, type MarcaDia } from "@src/lib/roles-servicio/marcas";
import { prisma } from "@src/lib/prisma";

export type SaveMarcasResult =
  | { ok: true }
  | { ok: false; message: string };

function normalizarMarcas(dias: MarcaDia[]): MarcaDia[] {
  const porDia = new Map<number, string>();
  for (const item of dias) {
    const dia = Math.floor(Number(item.dia));
    const marca = String(item.marca ?? "")
      .trim()
      .toUpperCase();
    if (!Number.isInteger(dia) || dia < 1 || dia > 31 || !marca) continue;
    porDia.set(dia, marca);
  }
  return [...porDia.entries()]
    .map(([dia, marca]) => ({ dia, marca }))
    .sort((a, b) => a.dia - b.dia);
}

/** Actualiza las marcas de una asignación del rol. */
export async function actualizarMarcasAsignacion(
  asignacionId: string,
  dias: MarcaDia[],
): Promise<SaveMarcasResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para editar el rol." };
  }

  const normalizadas = normalizarMarcas(dias);
  try {
    const existe = await prisma.asignacionRolServicio.findUnique({
      where: { id: asignacionId },
      select: { id: true },
    });
    if (!existe) return { ok: false, message: "Asignación no encontrada." };

    await prisma.asignacionRolServicio.update({
      where: { id: asignacionId },
      data: { dias: normalizadas },
    });
    revalidatePath(routes.personal.rolesServicio);
    return { ok: true };
  } catch (e) {
    console.error("[roles-servicio-marcas]", e);
    return { ok: false, message: "No se pudieron guardar las marcas." };
  }
}

/** Guarda marcas de varias asignaciones en un solo paso (generador). */
export async function actualizarMarcasLote(
  cambios: Array<{ asignacionId: string; dias: MarcaDia[] }>,
): Promise<SaveMarcasResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para editar el rol." };
  }

  if (cambios.length === 0) return { ok: true };

  try {
    await prisma.$transaction(
      cambios.map((cambio) =>
        prisma.asignacionRolServicio.update({
          where: { id: cambio.asignacionId },
          data: { dias: normalizarMarcas(cambio.dias) },
        }),
      ),
    );
    revalidatePath(routes.personal.rolesServicio);
    return { ok: true };
  } catch (e) {
    console.error("[roles-servicio-marcas-lote]", e);
    return { ok: false, message: "No se pudo guardar la generación del rol." };
  }
}

/** Lee marcas actuales (útil tras conflictos). */
export async function leerMarcasAsignacion(asignacionId: string): Promise<MarcaDia[] | null> {
  const row = await prisma.asignacionRolServicio.findUnique({
    where: { id: asignacionId },
    select: { dias: true },
  });
  if (!row) return null;
  return marcasDesdeJson(row.dias);
}
