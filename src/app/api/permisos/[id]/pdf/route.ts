import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import type { MembreteLogoKind } from "@src/lib/membrete";
import { presentarFormatoPermiso } from "@src/lib/pdf/formato-permiso";
import { FormatoPermisoPdfFile } from "@src/lib/pdf/formato-permiso-file";
import { loadFormatoPermisoPlantilla } from "@src/lib/pdf/load-formato-permiso";
import { boletaCefoaLogoUri, boletaEjercitoLogoUri } from "@src/lib/pdf/institution-logo";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import { prisma } from "@src/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

registerFichaTecnicaPdfFonts();

function logoUri(kind: MembreteLogoKind): string | null {
  if (kind === "cefoa") return boletaCefoaLogoUri();
  if (kind === "ejercito") return boletaEjercitoLogoUri();
  return null;
}

function safeFilePart(value: string) {
  return value.replace(/[^\w.-]+/g, "_").replace(/^\.+/, "").slice(0, 40) || "permiso";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const permiso = await prisma.permisoPersonal.findUnique({
    where: { id },
    include: {
      aspirante: {
        select: {
          nombres: true,
          apellidos: true,
          cedula: true,
          direccion: true,
          telefono: true,
          unidadPostulante: true,
          condicionMilitar: true,
          peloton: { select: { nombre: true } },
          convocatoria: { select: { comandanteNombre: true } },
        },
      },
    },
  });
  if (!permiso) {
    return NextResponse.json({ message: "Permiso no encontrado." }, { status: 404 });
  }

  const plantilla = await loadFormatoPermisoPlantilla();
  const presentacion = presentarFormatoPermiso(plantilla, {
    condicionMilitar: permiso.aspirante.condicionMilitar,
    apellidos: permiso.aspirante.apellidos,
    nombres: permiso.aspirante.nombres,
    cedula: permiso.aspirante.cedula,
    peloton: permiso.aspirante.peloton?.nombre ?? null,
    unidad: permiso.aspirante.unidadPostulante,
    telefono: permiso.aspirante.telefono,
    direccion: permiso.aspirante.direccion,
    tipo: permiso.tipo,
    fechaInicio: permiso.fechaInicio,
    fechaFin: permiso.fechaFin,
    anulado: permiso.anulado,
    comandanteNombre: permiso.aspirante.convocatoria.comandanteNombre,
  });

  let buffer: Buffer;
  try {
    const doc = createElement(FormatoPermisoPdfFile, {
      presentacion,
      logoIzq: logoUri(presentacion.logoIzq),
      logoDer: logoUri(presentacion.logoDer),
    });
    buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  } catch (err) {
    console.error("PERMISO_FORMATO_PDF", err);
    return NextResponse.json(
      { message: "No se pudo generar la boleta. Intente de nuevo." },
      { status: 500 },
    );
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "PERMISO_FORMATO_PDF",
    entityType: "PERMISO",
    entityId: permiso.id,
    metadata: { aspiranteId: permiso.aspiranteId, anulado: permiso.anulado },
  });

  const filename = `boleta-permiso-${safeFilePart(permiso.aspirante.cedula)}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
