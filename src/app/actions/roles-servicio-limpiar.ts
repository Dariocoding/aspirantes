"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import { prisma } from "@src/lib/prisma";

export type LimpiarSinMarcasResult =
  | { ok: true; eliminados: number }
  | { ok: false; message: string };

/** Quita del mes a quienes están en la lista pero no tienen ningún día de guardia. */
export async function limpiarAsignacionesSinMarcas(
  anio: number,
  mes: number,
): Promise<LimpiarSinMarcasResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para limpiar el personal." };
  }

  const anioOk = Math.floor(anio);
  const mesOk = Math.floor(mes);
  if (anioOk < 2000 || anioOk > 2100 || mesOk < 1 || mesOk > 12) {
    return { ok: false, message: "El mes no es válido." };
  }

  const sellado = await prisma.planRolServicio.findFirst({
    where: { anio: anioOk, mes: mesOk, sellado: true },
    select: { id: true },
  });
  if (sellado) {
    return { ok: false, message: "Este mes está sellado. No se puede quitar personal." };
  }

  const planes = await prisma.planRolServicio.findMany({
    where: { anio: anioOk, mes: mesOk },
    select: {
      id: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        select: { id: true, orden: true, dias: true },
      },
    },
  });
  if (planes.length === 0) {
    return { ok: false, message: "Este mes no tiene roles." };
  }

  const aEliminar: string[] = [];
  const aReordenar: Array<{ id: string; orden: number }> = [];

  for (const plan of planes) {
    let orden = 1;
    for (const asignacion of plan.asignaciones) {
      if (marcasDesdeJson(asignacion.dias).length === 0) {
        aEliminar.push(asignacion.id);
        continue;
      }
      if (asignacion.orden !== orden) {
        aReordenar.push({ id: asignacion.id, orden });
      }
      orden += 1;
    }
  }

  if (aEliminar.length === 0) {
    return { ok: true, eliminados: 0 };
  }

  await prisma.asignacionRolServicio.deleteMany({ where: { id: { in: aEliminar } } });
  for (let i = 0; i < aReordenar.length; i += 25) {
    const lote = aReordenar.slice(i, i + 25);
    await Promise.all(
      lote.map((item) =>
        prisma.asignacionRolServicio.update({
          where: { id: item.id },
          data: { orden: item.orden },
        }),
      ),
    );
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "ROLES_SERVICIO_LIMPIAR_SIN_MARCAS",
    entityType: "PLAN_ROL_SERVICIO",
    metadata: { anio: anioOk, mes: mesOk, eliminados: aEliminar.length },
  });

  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.personal.rolesServicioEstudio);
  return { ok: true, eliminados: aEliminar.length };
}
