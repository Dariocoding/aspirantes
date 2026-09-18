import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { buildAspiranteCensusWhere, censusOrderBy, isCensusGradoGroupSort, isCensusNacimientoMesSort, sortAspirantesByGradoEducativo, sortAspirantesByNacimientoMes } from "@src/lib/aspirantes/census";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { CENSUS_EXPORT_DEFAULT_IDS, parseCensusExportColumnIds } from "@src/lib/aspirantes/census-export-columns";
import { buildAspirantesCensoXlsxBuffer } from "@src/lib/excel/build-aspirantes-censo-xlsx";
import { buildAspirantesCumpleanosXlsxBuffer } from "@src/lib/excel/build-aspirantes-cumpleanos-xlsx";
import { ageFromBirthDate } from "@src/lib/date";
import { labelPeloton } from "@src/lib/pelotones";
import { AspirantesCensoPdfDocument } from "@src/lib/pdf/aspirantes-censo-document";
import { AspiranteFichasTecnicasBulkPdfDocument } from "@src/lib/pdf/aspirante-ficha-tecnica-document";
import { buildDocumentosAcademicosBulkPdf } from "@src/lib/pdf/build-documentos-academicos-bulk-pdf";
import {
  fichaTecnicaPdfPropsFromAspirante,
  loadFotoForFichaTecnicaPdf,
  mapWithConcurrency,
} from "@src/lib/pdf/ficha-tecnica-from-aspirante";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import { prisma } from "@src/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

registerFichaTecnicaPdfFonts();

function parseSp(searchParams: URLSearchParams): Record<string, string | undefined> {
  const keys = [
    "q",
    "sexo",
    "sort",
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
  const pdfVariant =
    format === "pdf" && variantRaw === "fichas-tecnicas"
      ? "fichas-tecnicas"
      : format === "pdf" && variantRaw === "documentos-academicos"
        ? "documentos-academicos"
        : "censo";
  const xlsxVariant = format === "xlsx" && variantRaw === "cumpleanos" ? "cumpleanos" : "censo";
  if (format === "xlsx" && variantRaw && xlsxVariant === "censo" && variantRaw !== "censo") {
    return NextResponse.json(
      { message: "Parámetro variant inválido (use censo o cumpleanos)" },
      { status: 400 },
    );
  }
  if (
    format === "pdf" &&
    variantRaw &&
    pdfVariant === "censo" &&
    variantRaw !== "censo"
  ) {
    return NextResponse.json(
      {
        message: "Parámetro variant inválido (use censo, fichas-tecnicas o documentos-academicos)",
      },
      { status: 400 },
    );
  }

  const scopeConvocatoria = url.searchParams.get("scope")?.toLowerCase().trim() === "convocatoria";
  const sp = parseSp(url.searchParams);
  if (scopeConvocatoria) {
    const convocatoria = sp.convocatoria;
    for (const key of Object.keys(sp)) {
      delete sp[key];
    }
    if (convocatoria) sp.convocatoria = convocatoria;
  }

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
    include: {
      convocatoria: true,
      datosFisicos: true,
      peloton: { select: { numero: true, nombre: true } },
      contactos: { take: 1, orderBy: { createdAt: "asc" } },
    },
    orderBy: sortInMemory ? undefined : sort,
  });
  const rows = nacimientoMesSort
    ? sortAspirantesByNacimientoMes(rowsRaw)
    : gradoSort
      ? sortAspirantesByGradoEducativo(rowsRaw)
      : rowsRaw;

  const generatedAt = new Date();

  const exportRows = rows.map((a) => {
    const contacto = a.contactos[0];
    return {
      nombres: a.nombres,
      apellidos: a.apellidos,
      unidadPostulante: a.unidadPostulante,
      tituloUniversidad: a.tituloUniversidad,
      tipoEstudio: a.tipoEstudio,
      cedula: a.cedula,
      sexo: a.sexo,
      edad: ageFromBirthDate(a.fechaNacimiento) ?? 0,
      fechaNacimiento: a.fechaNacimiento,
      lugarNacimiento: a.lugarNacimiento ?? "",
      calificacionAdmision: a.calificacionAdmision,
      pelotonLabel: a.peloton ? labelPeloton(a.peloton) : null,
      telefono: a.telefono,
      correo: a.correo,
      direccion: a.direccion,
      estadoCivil: a.estadoCivil,
      religion: a.religion,
      deporte: a.deporte,
      hijosCantidad: a.hijosCantidad,
      nombreUniversidad: a.nombreUniversidad,
      paisUniversidad: a.paisUniversidad,
      contactoNombre: contacto?.nombre ?? null,
      contactoParentesco: contacto?.parentesco ?? null,
      contactoTelefono: contacto?.telefono ?? null,
      estaturaCm: a.datosFisicos?.estaturaCm ?? null,
      pesoKg: a.datosFisicos?.pesoKg ?? null,
      tipoSangre: a.datosFisicos?.tipoSangre ?? null,
      factorRh: a.datosFisicos?.factorRh ?? null,
      tensionArterial: a.datosFisicos?.tensionArterial ?? null,
      alergias: a.datosFisicos?.alergias ?? null,
      condicionesMedicas: a.datosFisicos?.condicionesMedicas ?? null,
      discapacidad: a.datosFisicos?.discapacidad ?? null,
      observaciones: a.datosFisicos?.observaciones ?? null,
      tallaGorra: a.datosFisicos?.tallaGorra ?? null,
      tallaCamisa: a.datosFisicos?.tallaCamisa ?? null,
      tallaPantalon: a.datosFisicos?.tallaPantalon ?? null,
      tallaCalzado: a.datosFisicos?.tallaCalzado ?? null,
      fichaEvaluacion: a.fichaEvaluacion,
    };
  });

  const codigoSafe = safeFilePart(convocatoriaActual.codigo);
  const dateSafe = generatedAt.toISOString().slice(0, 10);
  const columnIds =
    format === "xlsx" && xlsxVariant === "censo"
      ? (parseCensusExportColumnIds(url.searchParams.get("columns")) ?? [...CENSUS_EXPORT_DEFAULT_IDS])
      : null;

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action:
      format === "xlsx"
        ? xlsxVariant === "cumpleanos"
          ? "CENSO_EXPORT_XLSX_CUMPLEANOS"
          : "CENSO_EXPORT_XLSX"
        : pdfVariant === "fichas-tecnicas"
          ? "CENSO_EXPORT_PDF_FICHAS_TECNICAS"
          : pdfVariant === "documentos-academicos"
            ? "CENSO_EXPORT_PDF_DOCUMENTOS_ACADEMICOS"
            : "CENSO_EXPORT_PDF",
    entityType: "CENSO",
    entityId: convocatoriaFiltroId,
    metadata: {
      format,
      variant: format === "xlsx" ? xlsxVariant : pdfVariant,
      rowCount: rows.length,
      convocatoriaCodigo: convocatoriaActual.codigo,
      convocatoriaNombre: convocatoriaActual.nombre,
      ...(columnIds ? { columns: columnIds } : {}),
      ...(scopeConvocatoria ? { scope: "convocatoria" } : {}),
    },
  });

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

  if (format === "xlsx") {
    const buffer = await buildAspirantesCensoXlsxBuffer({
      convocatoriaNombre: convocatoriaActual.nombre,
      convocatoriaCodigo: convocatoriaActual.codigo,
      anio: convocatoriaActual.anio,
      rows: exportRows,
      columnIds: columnIds ?? [...CENSUS_EXPORT_DEFAULT_IDS],
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

  if (pdfVariant === "fichas-tecnicas") {
    if (!rows.length) {
      return NextResponse.json(
        { message: "No hay aspirantes que coincidan con los filtros actuales." },
        { status: 404 },
      );
    }

    const items = await mapWithConcurrency(rows, 6, async (a) => {
      const foto = await loadFotoForFichaTecnicaPdf(a.fotoKey);
      return fichaTecnicaPdfPropsFromAspirante(a, foto);
    });

    const title = `Fichas técnicas — ${convocatoriaActual.nombre}`;
    const doc = createElement(AspiranteFichasTecnicasBulkPdfDocument, {
      items,
      title,
    });
    let buffer: Awaited<ReturnType<typeof renderToBuffer>>;
    try {
      buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
    } catch (err) {
      console.error("CENSO_EXPORT_PDF_FICHAS_TECNICAS", err);
      return NextResponse.json(
        { message: "No se pudo generar el PDF masivo de fichas técnicas. Intente de nuevo o reduzca el conjunto." },
        { status: 500 },
      );
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fichas-tecnicas-${codigoSafe}-${dateSafe}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (pdfVariant === "documentos-academicos") {
    if (!rows.length) {
      return NextResponse.json(
        { message: "No hay aspirantes que coincidan con los filtros actuales." },
        { status: 404 },
      );
    }

    try {
      const buffer = await buildDocumentosAcademicosBulkPdf(
        rows.map((a) => ({
          nombres: a.nombres,
          apellidos: a.apellidos,
          cedula: a.cedula,
          tituloUniversidad: a.tituloUniversidad,
          unidadPostulante: a.unidadPostulante,
          fotoTituloKey: a.fotoTituloKey,
          fotoTituloAutenticacionKey: a.fotoTituloAutenticacionKey,
          fotoNotasKey: a.fotoNotasKey,
        })),
        {
          convocatoriaNombre: convocatoriaActual.nombre,
          convocatoriaCodigo: convocatoriaActual.codigo,
          generatedAt,
        },
      );
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="documentos-academicos-${codigoSafe}-${dateSafe}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (err) {
      if (err instanceof Error && err.message === "NONE") {
        return NextResponse.json(
          {
            message: "No hay aspirantes que coincidan con los filtros actuales.",
          },
          { status: 404 },
        );
      }
      console.error("CENSO_EXPORT_PDF_DOCUMENTOS_ACADEMICOS", err);
      return NextResponse.json(
        {
          message:
            "No se pudo generar el PDF masivo de documentos académicos. Intente de nuevo o reduzca el conjunto.",
        },
        { status: 500 },
      );
    }
  }

  const generatedAtStr = generatedAt.toLocaleString("es-VE", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const doc = createElement(AspirantesCensoPdfDocument, {
    convocatoriaNombre: convocatoriaActual.nombre,
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
