import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { buildAspiranteCensusWhere, censusOrderBy, isCensusGradoGroupSort, isCensusNacimientoMesSort, sortAspirantesByGradoEducativo, sortAspirantesByNacimientoMes } from "@src/lib/aspirantes/census";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { buildAspirantesCensoXlsxBuffer } from "@src/lib/excel/build-aspirantes-censo-xlsx";
import { buildAspirantesCumpleanosXlsxBuffer } from "@src/lib/excel/build-aspirantes-cumpleanos-xlsx";
import { buildAspirantesExamenesMedicosXlsxBuffer } from "@src/lib/excel/build-aspirantes-examenes-medicos-xlsx";
import { buildAspirantesListaOficialXlsxBuffer } from "@src/lib/excel/build-aspirantes-lista-oficial-xlsx";
import { ageFromBirthDate } from "@src/lib/date";
import { AspirantesCensoPdfDocument } from "@src/lib/pdf/aspirantes-censo-document";
import { prisma } from "@src/lib/prisma";

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
    "peloton",
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
  if (!canWrite(authContextFromSession(session))) {
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

  const variantRaw = url.searchParams.get("variant")?.toLowerCase().trim() ?? "";
  const xlsxVariant =
    format === "xlsx" && variantRaw === "examenes-medicos"
      ? "examenes-medicos"
      : format === "xlsx" && variantRaw === "lista-oficial"
        ? "lista-oficial"
        : format === "xlsx" && variantRaw === "cumpleanos"
          ? "cumpleanos"
          : "censo";
  if (
    format === "xlsx" &&
    variantRaw &&
    xlsxVariant === "censo" &&
    variantRaw !== "censo"
  ) {
    return NextResponse.json(
      {
        message:
          "Parámetro variant inválido (use censo, examenes-medicos, lista-oficial o cumpleanos)",
      },
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
  const sort = censusOrderBy(sp.sort);
  const nacimientoMesSort = isCensusNacimientoMesSort(sp.sort);
  const gradoSort = isCensusGradoGroupSort(sp.sort);
  const sortInMemory = nacimientoMesSort || gradoSort;

  const rowsRaw = await prisma.aspirante.findMany({
    where,
    include: { convocatoria: true, datosFisicos: true },
    orderBy: sortInMemory ? undefined : sort,
  });
  const rows = nacimientoMesSort
    ? sortAspirantesByNacimientoMes(rowsRaw)
    : gradoSort
      ? sortAspirantesByGradoEducativo(rowsRaw)
      : rowsRaw;

  const generatedAt = new Date();

  const exportRows = rows.map((a) => ({
    nombres: a.nombres,
    apellidos: a.apellidos,
    unidadPostulante: a.unidadPostulante,
    tituloUniversidad: a.tituloUniversidad,
    calificacionAdmision: a.calificacionAdmision,
    convocatoriaCodigo: a.convocatoria.codigo,
    convocatoriaNombre: a.convocatoria.nombre,
    convocatoriaActiva: a.convocatoria.activa,
    cedula: a.cedula,
    sexo: a.sexo,
    edad: ageFromBirthDate(a.fechaNacimiento) ?? 0,
    fechaNacimiento: a.fechaNacimiento,
  }));

  const codigoSafe = safeFilePart(convocatoriaActual.codigo);
  const dateSafe = generatedAt.toISOString().slice(0, 10);

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action:
      format === "xlsx"
        ? xlsxVariant === "examenes-medicos"
          ? "CENSO_EXPORT_XLSX_EXAMENES"
          : xlsxVariant === "lista-oficial"
            ? "CENSO_EXPORT_XLSX_LISTA_OFICIAL"
            : xlsxVariant === "cumpleanos"
              ? "CENSO_EXPORT_XLSX_CUMPLEANOS"
              : "CENSO_EXPORT_XLSX"
        : "CENSO_EXPORT_PDF",
    entityType: "CENSO",
    entityId: convocatoriaFiltroId,
    metadata: {
      format,
      variant: format === "xlsx" ? xlsxVariant : undefined,
      rowCount: rows.length,
      convocatoriaCodigo: convocatoriaActual.codigo,
      convocatoriaNombre: convocatoriaActual.nombre,
    },
  });

  if (format === "xlsx" && xlsxVariant === "lista-oficial") {
    const buffer = await buildAspirantesListaOficialXlsxBuffer({
      convocatoriaNombre: convocatoriaActual.nombre,
      convocatoriaCodigo: convocatoriaActual.codigo,
      anio: convocatoriaActual.anio,
      rows: rows.map((a) => ({
        nombres: a.nombres,
        apellidos: a.apellidos,
        cedula: a.cedula,
        sexo: a.sexo,
      })),
      generatedAt,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="lista-oficial-${codigoSafe}-${dateSafe}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "xlsx" && xlsxVariant === "cumpleanos") {
    const buffer = await buildAspirantesCumpleanosXlsxBuffer({
      convocatoriaNombre: convocatoriaActual.nombre,
      convocatoriaCodigo: convocatoriaActual.codigo,
      anio: convocatoriaActual.anio,
      rows: rows.map((a) => ({
        nombres: a.nombres,
        apellidos: a.apellidos,
        cedula: a.cedula,
        fechaNacimiento: a.fechaNacimiento,
        edad: ageFromBirthDate(a.fechaNacimiento),
      })),
      generatedAt,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="cumpleanos-aspirantes-${codigoSafe}-${dateSafe}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "xlsx" && xlsxVariant === "examenes-medicos") {
    const buffer = await buildAspirantesExamenesMedicosXlsxBuffer({
      convocatoriaNombre: convocatoriaActual.nombre,
      convocatoriaCodigo: convocatoriaActual.codigo,
      anio: convocatoriaActual.anio,
      rows: rows.map((a) => ({
        nombres: a.nombres,
        apellidos: a.apellidos,
        cedula: a.cedula,
        estaturaCm: a.datosFisicos?.estaturaCm ?? null,
        pesoKg: a.datosFisicos?.pesoKg ?? null,
        tensionArterial: a.datosFisicos?.tensionArterial ?? null,
        fichaEvaluacion: a.fichaEvaluacion,
      })),
      generatedAt,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="examenes-medicos-${codigoSafe}-${dateSafe}.xlsx"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

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
