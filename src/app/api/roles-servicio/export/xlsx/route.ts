import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import {
  buildRolesServicioXlsxBuffer,
  type PlanExportRol,
} from "@src/lib/excel/build-roles-servicio-xlsx";
import {
  contentDispositionAttachment,
  excelAttachmentFilename,
} from "@src/lib/excel/excel-export-name";
import { etiquetaMes, marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import { prisma } from "@src/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

const MESES_ARCHIVO = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function nombrePersona(asignacion: {
  nombre: string;
  aspirante: { nombres: string; apellidos: string } | null;
  autoridad: { nombres: string; apellidos: string } | null;
}): string {
  if (asignacion.aspirante) {
    return `${asignacion.aspirante.nombres} ${asignacion.aspirante.apellidos}`.trim();
  }
  if (asignacion.autoridad) {
    return `${asignacion.autoridad.nombres} ${asignacion.autoridad.apellidos}`.trim();
  }
  return asignacion.nombre.trim();
}

export async function GET(request: Request) {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "Sin permiso" }, { status: 403 });
  }

  const url = new URL(request.url);
  const anio = Number(url.searchParams.get("anio"));
  const mes = Number(url.searchParams.get("mes"));
  if (
    !Number.isInteger(anio) ||
    anio < 2000 ||
    anio > 2100 ||
    !Number.isInteger(mes) ||
    mes < 1 ||
    mes > 12
  ) {
    return NextResponse.json({ message: "Mes no válido" }, { status: 400 });
  }

  const planesDb = await prisma.planRolServicio.findMany({
    where: { anio, mes },
    orderBy: { rol: { sortOrder: "asc" } },
    include: {
      rol: { select: { clave: true, curso: true } },
      asignaciones: {
        orderBy: { orden: "asc" },
        include: {
          aspirante: { select: { nombres: true, apellidos: true } },
          autoridad: { select: { nombres: true, apellidos: true } },
        },
      },
    },
  });

  if (planesDb.length === 0) {
    return NextResponse.json({ message: "No hay roles publicados en ese mes" }, { status: 404 });
  }

  const planes: PlanExportRol[] = planesDb.map((plan) => ({
    clave: plan.rol.clave,
    nombre: plan.nombre,
    curso: plan.rol.curso,
    asignaciones: plan.asignaciones.map((asignacion) => ({
      orden: asignacion.orden,
      grado: asignacion.grado,
      nombre: nombrePersona(asignacion),
      dias: marcasDesdeJson(asignacion.dias),
    })),
  }));

  try {
    const buffer = await buildRolesServicioXlsxBuffer({ anio, mes, planes });
    const mesNombre = MESES_ARCHIVO[mes - 1] ?? String(mes);
    const filename = excelAttachmentFilename(
      `ROLES DE SERVICIO ${mesNombre.toUpperCase()} ${anio}`,
      `roles-servicio-${anio}-${String(mes).padStart(2, "0")}`,
    );

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "ROLES_SERVICIO_EXPORT_XLSX",
      entityType: "PLAN_ROL_SERVICIO",
      metadata: { anio, mes, roles: planes.length, bytes: buffer.length },
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDispositionAttachment(filename),
        "Cache-Control": "no-store",
        "X-Export-Label": etiquetaMes(anio, mes),
      },
    });
  } catch (error) {
    console.error("[roles-servicio-export-xlsx]", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "No se pudo exportar el Excel" },
      { status: 500 },
    );
  }
}
