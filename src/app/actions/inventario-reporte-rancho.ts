"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { InventarioActionState } from "@src/lib/action-types";
import { writeAuditLog } from "@src/lib/audit/log";
import { routes } from "@src/lib/apps/routes";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { requirePermission } from "@src/lib/auth/guards";
import { Permission } from "@src/lib/auth/permissions";
import {
  buildReporteRanchoDatos,
  getReporteRanchoByFecha,
  isFechaReportePermitida,
  parseReporteFecha,
  resumirReporteLineas,
  toDateKey,
} from "@src/lib/inventario/reporte-rancho";
import { canDeleteReporteRanchoEnLocalhost } from "@src/lib/inventario/reporte-rancho-dev";
import { prisma } from "@src/lib/prisma";
import { inventarioReporteRanchoSchema } from "@src/lib/validators/inventario-reporte";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { unauthorized } from "next/navigation";

function revalidateReportesRancho() {
  revalidatePath(routes.inventario.ranchoReportes);
  revalidatePath(routes.inventario.home);
}

export async function generarReporteRancho(
  _prev: InventarioActionState,
  formData: FormData,
): Promise<InventarioActionState> {
  const raw = {
    fecha: formData.get("fecha"),
    notas: formData.get("notas"),
  };

  const parsed = inventarioReporteRanchoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: zodFieldErrors(parsed.error) };
  }

  const fecha = parseReporteFecha(parsed.data.fecha);
  if (!fecha) {
    return { ok: false, errors: { fecha: "Fecha inválida." } };
  }

  if (!isFechaReportePermitida(fecha)) {
    return {
      ok: false,
      errors: { fecha: "Solo puede reportar el día de hoy o el día anterior." },
    };
  }

  const existente = await getReporteRanchoByFecha(fecha);
  if (existente) {
    return {
      ok: false,
      errors: { fecha: "Ya existe un reporte registrado para esa fecha." },
    };
  }

  const session = await requirePermission(Permission.INVENTARIO_RANCHO_WRITE);
  const datos = await buildReporteRanchoDatos(fecha);
  const lineas = datos.lineas;

  if (lineas.length === 0) {
    return {
      ok: false,
      errors: { fecha: "No hay ítems activos en el inventario del rancho." },
    };
  }

  const resumen = resumirReporteLineas(lineas);

  const reporte = await prisma.inventarioReporteRancho.create({
    data: {
      fecha,
      notas: parsed.data.notas,
      userId: session.user.id,
      lineas: {
        create: lineas.map((linea) => ({
          itemId: linea.itemId,
          nombre: linea.nombre,
          unidad: linea.unidad,
          stockMinimo: linea.stockMinimo,
          stockAyer: linea.stockAyer,
          stockReportado: linea.stockReportado,
          estado: linea.estado,
        })),
      },
    },
    select: { id: true, fecha: true },
  });

  await writeAuditLog({
    userId: session.user.id,
    action: "inventario.reporte_rancho.create",
    entityType: "InventarioReporteRancho",
    entityId: reporte.id,
    metadata: {
      fecha: toDateKey(fecha),
      totalItems: lineas.length,
      resumen,
    },
  });

  revalidateReportesRancho();

  return { ok: true, errors: {} };
}

export async function deleteReporteRancho(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  const host = (await headers()).get("host");
  if (!canDeleteReporteRanchoEnLocalhost(ctx, host)) {
    unauthorized();
  }

  const reporte = await prisma.inventarioReporteRancho.findUnique({
    where: { id },
    select: { id: true, fecha: true },
  });
  if (!reporte) {
    redirect(routes.inventario.ranchoReportes);
  }

  await prisma.inventarioReporteRancho.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: "inventario.reporte_rancho.delete",
    entityType: "InventarioReporteRancho",
    entityId: id,
    metadata: { fecha: toDateKey(reporte.fecha), entorno: "localhost" },
  });

  revalidateReportesRancho();
  redirect(routes.inventario.ranchoReportes);
}
