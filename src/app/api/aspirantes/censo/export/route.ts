import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeAuditLog } from "@/lib/audit/log";
import { buildAspiranteCensusWhere } from "@/lib/aspirantes/census";
import { canWrite } from "@/lib/auth/roles";
import { buildAspirantesCensoXlsxBuffer } from "@/lib/excel/build-aspirantes-censo-xlsx";
import { AspirantesCensoPdfDocument } from "@/lib/pdf/aspirantes-censo-document";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function parseSp(searchParams: URLSearchParams): Record<string, string | undefined> {
  const keys = [
    "q",
    "sexo",
    "edadMin",
    "edadMax",
    "sort",
    "calificacion",
    "unidadPostulante",
    "convocatoria",
  ];
  const out: Record<string, string | undefined> = {};
  for (const k of keys) {
    const v = searchParams.get(k);
    if (v !== null && v !== "") out[k] = v;
  }
  return out;
}

function safeFilePart(s: string) {
  return s.replace(/[^\w.-]+/g, "_").replace(/^\.+/, "").slice(0, 48) || "censo";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!canWrite(session.user.role)) {
    return NextResponse.json(
      { message: "No autorizado: el rol consulta no puede exportar el censo." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json(
      { message: "Parámetro format inválido (use xlsx o pdf)" },
      { status: 400 },
    );
  }

  const sp = parseSp(url.searchParams);

  const convocatorias = await prisma.convocatoria.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
  });

  if (!convocatorias.length) {
    return NextResponse.json({ message: "No hay convocatorias" }, { status: 404 });
  }

  const defaultConvocatoriaId = convocatorias[0]!.id;
  const paramC = sp.convocatoria?.trim();
  const convocatoriaFiltroId =
    paramC && convocatorias.some((c) => c.id === paramC) ? paramC : defaultConvocatoriaId;

  const convocatoriaActual =
    convocatorias.find((c) => c.id === convocatoriaFiltroId) ?? convocatorias[0]!;

  const where = buildAspiranteCensusWhere(sp, convocatoriaFiltroId);
  const sort = sp.sort === "nombres" ? ({ nombres: "asc" } as const) : ({ createdAt: "desc" } as const);

  const rows = await prisma.aspirante.findMany({
    where,
    include: { convocatoria: true },
    orderBy: sort,
  });

  const generatedAt = new Date();

  const exportRows = rows.map((a) => ({
    nombres: a.nombres,
    apellidos: a.apellidos,
    unidadPostulante: a.unidadPostulante,
    calificacionAdmision: a.calificacionAdmision,
    convocatoriaCodigo: a.convocatoria.codigo,
    convocatoriaNombre: a.convocatoria.nombre,
    convocatoriaActiva: a.convocatoria.activa,
    cedula: a.cedula,
    sexo: a.sexo,
    edad: a.edad,
    fechaNacimiento: a.fechaNacimiento,
  }));

  const codigoSafe = safeFilePart(convocatoriaActual.codigo);
  const dateSafe = generatedAt.toISOString().slice(0, 10);

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: format === "xlsx" ? "CENSO_EXPORT_XLSX" : "CENSO_EXPORT_PDF",
    entityType: "CENSO",
    entityId: convocatoriaFiltroId,
    metadata: {
      format,
      rowCount: rows.length,
      convocatoriaCodigo: convocatoriaActual.codigo,
      convocatoriaNombre: convocatoriaActual.nombre,
    },
  });

  if (format === "xlsx") {
    const buffer = await buildAspirantesCensoXlsxBuffer({
      convocatoriaNombre: convocatoriaActual.nombre,
      convocatoriaCodigo: convocatoriaActual.codigo,
      anio: convocatoriaActual.anio,
      rows: exportRows,
      generatedAt,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="censo-aspirantes-${codigoSafe}-${dateSafe}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const generatedAtStr = generatedAt.toLocaleString("es-VE", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const doc = createElement(AspirantesCensoPdfDocument, {
    convocatoriaNombre: convocatoriaActual.nombre,
    convocatoriaCodigo: convocatoriaActual.codigo,
    anio: convocatoriaActual.anio,
    generatedAt: generatedAtStr,
    rows: exportRows,
  });

  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="censo-aspirantes-${codigoSafe}-${dateSafe}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
