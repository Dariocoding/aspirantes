"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";

export type SellarMesResult = { ok: true } | { ok: false; message: string };

export async function sellarMesRoles(anio: number, mes: number, sellado: boolean): Promise<SellarMesResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para sellar el mes." };
  }

  const anioOk = Math.floor(anio);
  const mesOk = Math.floor(mes);
  if (anioOk < 2000 || anioOk > 2100 || mesOk < 1 || mesOk > 12) {
    return { ok: false, message: "El mes no es válido." };
  }

  const planes = await prisma.planRolServicio.findMany({
    where: { anio: anioOk, mes: mesOk },
    select: { id: true },
  });
  if (planes.length === 0) {
    return { ok: false, message: "Este mes no tiene guardias para sellar." };
  }

  await prisma.planRolServicio.updateMany({
    where: { anio: anioOk, mes: mesOk },
    data: { sellado },
  });

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: sellado ? "ROLES_SERVICIO_SELLAR" : "ROLES_SERVICIO_ABRIR_SELLO",
    entityType: "PLAN_ROL_SERVICIO",
    metadata: { anio: anioOk, mes: mesOk, planes: planes.length },
  });

  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.personal.rolesServicioEstudio);
  return { ok: true };
}
