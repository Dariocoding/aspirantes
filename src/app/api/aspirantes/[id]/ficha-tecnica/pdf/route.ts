import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { parseFichaEvaluacion } from "@src/lib/aspirantes/ficha-evaluacion";
import { labelEstadoCivilPdf } from "@src/lib/aspirantes/estado-civil";
import { labelTipoEstudioPdf } from "@src/lib/aspirantes/tipo-estudio";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { AspiranteFichaTecnicaPdfDocument } from "@src/lib/pdf/aspirante-ficha-tecnica-document";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import { prisma } from "@src/lib/prisma";
import { getObjectBuffer } from "@src/lib/storage/s3";

export const runtime = "nodejs";

registerFichaTecnicaPdfFonts();

async function loadFotoForPdf(fotoKey: string | null): Promise<Buffer | null> {
  if (!fotoKey) return null;
  const lower = fotoKey.toLowerCase();
  // @react-pdf solo embebe JPEG/PNG de forma fiable
  if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
    return null;
  }
  try {
    const { body } = await getObjectBuffer(fotoKey);
    return body;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const a = await prisma.aspirante.findUnique({
    where: { id },
    include: {
      convocatoria: true,
      datosFisicos: true,
      contactos: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  if (!a) {
    return NextResponse.json({ message: "No encontrado" }, { status: 404 });
  }

  const foto = await loadFotoForPdf(a.fotoKey);
  const ficha = parseFichaEvaluacion(a.fichaEvaluacion);

  const doc = createElement(AspiranteFichaTecnicaPdfDocument, {
    nombres: a.nombres,
    apellidos: a.apellidos,
    cedula: a.cedula,
    edad: a.edad,
    sexo: a.sexo === "FEMENINO" ? "FEMENINO" : "MASCULINO",
    telefono: a.telefono,
    hijosCantidad: a.hijosCantidad,
    estadoCivil: labelEstadoCivilPdf(a.estadoCivil),
    unidadPostulante: a.unidadPostulante,
    convocatoriaNombre: a.convocatoria.nombre,
    convocatoriaCodigo: a.convocatoria.codigo,
    foto,
    ficha,
    nivelEducativo: labelTipoEstudioPdf(a.tipoEstudio),
    cmdteCursoNombre: a.convocatoria.comandanteNombre,
    cmdteCursoTelefono: a.convocatoria.comandanteTelefono,
    estudios: a.nombreUniversidad || a.tituloUniversidad
      ? [
          {
            universidad: a.nombreUniversidad ?? "",
            titulo: a.tituloUniversidad ?? "",
            pais: a.paisUniversidad ?? "",
            anioIngreso: a.anioIngresoUniversidad != null ? String(a.anioIngresoUniversidad) : "",
            anioEgreso: a.anioEgresoUniversidad != null ? String(a.anioEgresoUniversidad) : "",
            nucleo: a.nucleoUniversidad ?? "",
          },
        ]
      : undefined,
    // Régimen disciplinario militar: por defecto todo en NO
    investigacionAdministrativa: false,
    investigacionJudicial: false,
    registroSiipol: false,
    investigacionPenalMilitar: false,
    juicioAbierto: false,
    // Estudio culminado: por defecto SI
    estudioCulminado: true,
  });

  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "ASPIRANTE_FICHA_TECNICA_PDF",
    entityType: "ASPIRANTE",
    entityId: a.id,
    metadata: { cedula: a.cedula },
  });

  const safeName = a.cedula.replace(/\D/g, "") || a.id;
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ficha-tecnica-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
