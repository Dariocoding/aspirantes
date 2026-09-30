import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { buildAspiranteCensusWhere } from "@src/lib/aspirantes/census";
import { labelTipoEstudio } from "@src/lib/aspirantes/tipo-estudio";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { ConstanciaEstudiosPdfDocument, type ConstanciaEstudiosPerson } from "@src/lib/pdf/constancia-estudios-document";
import { boletaCefoaLogoUri, boletaEjercitoLogoUri } from "@src/lib/pdf/institution-logo";
import { parseBoletaIdsParam } from "@src/lib/pdf/boleta-permiso";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import { prisma } from "@src/lib/prisma";
import type { Prisma } from "@src/generated/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

registerFichaTecnicaPdfFonts();

const MAX_CONSTANCIAS = 250;
const CENSUS_KEYS = ["q", "sexo", "sort", "peloton", "convocatoria", "condicion"] as const;

const include = {
  peloton: { select: { numero: true, nombre: true } },
  convocatoria: {
    select: { id: true, codigo: true, nombre: true, anio: true, comandanteNombre: true },
  },
} satisfies Prisma.AspiranteInclude;

type Row = Prisma.AspiranteGetPayload<{ include: typeof include }>;

function parseSp(searchParams: URLSearchParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of CENSUS_KEYS) {
    const value = searchParams.get(key);
    if (value !== null && value !== "") out[key] = value;
  }
  return out;
}

function dash(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function pelotonLabel(peloton: { numero: number; nombre: string } | null): string {
  if (!peloton) return "Sin asignar";
  return peloton.nombre.trim() || `Pelotón ${peloton.numero}`;
}

function toPerson(row: Row): ConstanciaEstudiosPerson {
  const femenino = row.sexo === "FEMENINO";
  return {
    nombres: row.nombres,
    apellidos: row.apellidos,
    cedula: row.cedula,
    trato: femenino ? "la ciudadana" : "el ciudadano",
    fechaNacimiento: format(row.fechaNacimiento, "dd/MM/yyyy"),
    tipoEstudio: labelTipoEstudio(row.tipoEstudio) ?? "el nivel declarado en el censo",
    universidad: dash(row.nombreUniversidad) || "la institución registrada",
    nucleo: dash(row.nucleoUniversidad),
    titulo: dash(row.tituloUniversidad),
    pais: dash(row.paisUniversidad),
    anioIngreso: dash(row.anioIngresoUniversidad),
    anioEgreso: dash(row.anioEgresoUniversidad),
    unidad: dash(row.unidadPostulante),
    peloton: pelotonLabel(row.peloton),
    convocatoriaNombre: row.convocatoria.nombre,
    convocatoriaCodigo: row.convocatoria.codigo,
    convocatoriaAnio: String(row.convocatoria.anio),
    comandante: dash(row.convocatoria.comandanteNombre),
  };
}

function safeFilePart(value: string) {
  return value.replace(/[^\w.-]+/g, "_").replace(/^\.+/, "").slice(0, 48) || "constancia";
}

async function resolveConvocatoriaId(sp: Record<string, string | undefined>): Promise<string | null> {
  const convocatorias = await prisma.convocatoria.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  if (!convocatorias.length) return null;
  const param = sp.convocatoria?.trim();
  if (param && convocatorias.some((c) => c.id === param)) return param;
  return convocatorias[0]!.id;
}

async function loadByIds(ids: string[]) {
  if (!ids.length) return [] as Row[];
  const rows = await prisma.aspirante.findMany({
    where: { id: { in: ids } },
    include,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

async function pdfResponse(userId: string | undefined, userEmail: string | null | undefined, rows: Row[]) {
  if (!rows.length) {
    return NextResponse.json({ message: "No hay personal para generar la constancia." }, { status: 404 });
  }
  if (rows.length > MAX_CONSTANCIAS) {
    return NextResponse.json(
      { message: `Como máximo se pueden generar ${MAX_CONSTANCIAS} constancias a la vez.` },
      { status: 400 },
    );
  }
  const convocatoriaId = rows[0]!.convocatoriaId;
  if (rows.some((row) => row.convocatoriaId !== convocatoriaId)) {
    return NextResponse.json({ message: "Seleccione personal de una sola convocatoria." }, { status: 400 });
  }

  const people = rows.map(toPerson);
  const emitidaEn = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });
  let buffer: Buffer;
  try {
    const doc = createElement(ConstanciaEstudiosPdfDocument, {
      people,
      emitidaEn,
      logoCefoa: boletaCefoaLogoUri(),
      logoEjercito: boletaEjercitoLogoUri(),
    });
    buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  } catch (error) {
    console.error("CONSTANCIA_ESTUDIOS_PDF", error);
    return NextResponse.json({ message: "No se pudo generar la constancia. Intente de nuevo." }, { status: 500 });
  }

  await writeAuditLog({
    userId,
    userEmail,
    action: "CONSTANCIA_ESTUDIOS_PDF",
    entityType: "ASPIRANTE",
    entityId: rows.length === 1 ? rows[0]!.id : convocatoriaId,
    metadata: { count: rows.length, convocatoriaId },
  });

  const filename =
    rows.length === 1
      ? `constancia-estudios-${safeFilePart(rows[0]!.cedula)}.pdf`
      : `constancias-estudios-${safeFilePart(rows[0]!.convocatoria.codigo)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function authorize() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, response: NextResponse.json({ message: "No autenticado" }, { status: 401 }) };
  }
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return { ok: false as const, response: NextResponse.json({ message: "No autorizado" }, { status: 403 }) };
  }
  return { ok: true as const, session, ctx };
}

export async function GET(request: Request) {
  const authResult = await authorize();
  if (!authResult.ok) return authResult.response;
  const { session, ctx } = authResult;

  const url = new URL(request.url);
  const ids = parseBoletaIdsParam(url.searchParams.get("ids")).slice(0, MAX_CONSTANCIAS);
  if (ids.length === 1) {
    return pdfResponse(session.user.id, session.user.email, await loadByIds(ids));
  }
  if (!canWrite(ctx)) {
    return NextResponse.json(
      { message: "No autorizado: el rol consulta no puede descargar constancias masivas." },
      { status: 403 },
    );
  }
  if (ids.length > 1) {
    return pdfResponse(session.user.id, session.user.email, await loadByIds(ids));
  }

  const sp = parseSp(url.searchParams);
  const convocatoriaId = await resolveConvocatoriaId(sp);
  if (!convocatoriaId) {
    return NextResponse.json({ message: "No hay convocatorias" }, { status: 404 });
  }
  const scopeConvocatoria = url.searchParams.get("scope")?.toLowerCase().trim() === "convocatoria";
  const where = scopeConvocatoria ? { convocatoriaId } : buildAspiranteCensusWhere(sp, convocatoriaId);
  const rows = await prisma.aspirante.findMany({
    where,
    include,
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    take: MAX_CONSTANCIAS + 1,
  });
  return pdfResponse(session.user.id, session.user.email, rows);
}

export async function POST(request: Request) {
  const authResult = await authorize();
  if (!authResult.ok) return authResult.response;
  const { session, ctx } = authResult;

  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = parseBoletaIdsParam(body?.ids).slice(0, MAX_CONSTANCIAS);
  if (!ids.length) {
    return NextResponse.json({ message: "Seleccione al menos un personal." }, { status: 400 });
  }
  if (ids.length > 1 && !canWrite(ctx)) {
    return NextResponse.json(
      { message: "No autorizado: el rol consulta no puede descargar constancias masivas." },
      { status: 403 },
    );
  }
  return pdfResponse(session.user.id, session.user.email, await loadByIds(ids));
}
