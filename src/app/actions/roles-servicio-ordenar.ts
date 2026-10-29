"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import { ordenarAsignacionesEscalera } from "@src/lib/roles-servicio/ordenar-escalera";
import { prisma } from "@src/lib/prisma";

export type OrdenarEscaleraResult =
  | { ok: true; movidos: number }
  | { ok: false; message: string };

/**
 * Reordena las filas del rol por primer día de guardia (patrón escalera / diagonal).
 */
export async function ordenarRolEscalera(
  anio: number,
  mes: number,
  claveRol: string,
): Promise<OrdenarEscaleraResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para reordenar el rol." };
  }

  const anioOk = Math.floor(anio);
  const mesOk = Math.floor(mes);
  const clave = claveRol.trim();
  if (anioOk < 2000 || anioOk > 2100 || mesOk < 1 || mesOk > 12 || !clave) {
    return { ok: false, message: "Los datos del rol no son válidos." };
  }

  const plan = await prisma.planRolServicio.findFirst({
    where: { anio: anioOk, mes: mesOk, rol: { clave } },
    select: {
      id: true,
      sellado: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        select: { id: true, orden: true, dias: true },
      },
    },
  });
  if (!plan) return { ok: false, message: "No se encontró el rol en este mes." };
  if (plan.sellado) {
    return { ok: false, message: "Este mes está sellado. No se puede reordenar." };
  }
  if (plan.asignaciones.length < 2) {
    return { ok: true, movidos: 0 };
  }

  const ordenadas = ordenarAsignacionesEscalera(
    plan.asignaciones.map((asignacion) => ({
      id: asignacion.id,
      orden: asignacion.orden,
      dias: marcasDesdeJson(asignacion.dias),
    })),
  );

  const cambios = ordenadas.flatMap((item) => {
    const actual = plan.asignaciones.find((a) => a.id === item.id);
    if (!actual || actual.orden === item.orden) return [];
    return [{ id: item.id, orden: item.orden }];
  });

  if (cambios.length === 0) {
    return { ok: true, movidos: 0 };
  }

  for (let i = 0; i < cambios.length; i += 25) {
    const lote = cambios.slice(i, i + 25);
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
    action: "ROLES_SERVICIO_ORDENAR_ESCALERA",
    entityType: "PLAN_ROL_SERVICIO",
    entityId: plan.id,
    metadata: { anio: anioOk, mes: mesOk, clave, movidos: cambios.length },
  });

  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.personal.rolesServicioEstudio);
  return { ok: true, movidos: cambios.length };
}
