import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { buildAspiranteCensusWhere } from "@src/lib/aspirantes/census";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { BoletasPermisoPdfDocument } from "@src/lib/pdf/boleta-permiso-document";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import {
  boletaConvocatoriaInfo,
  boletaRankByApellidos,
  boletaRasgosFromDatos,
  formatBoletaSerial,
  formatTelefonoBoleta,
  loadFotoForBoletaPdf,
  pickFotoForBoleta,
  MAX_BOLETAS_PERMISO,
  parseBoletaIdsParam,
  type BoletaPermisoCard,
} from "@src/lib/pdf/boleta-permiso";
import { mapWithConcurrency } from "@src/lib/pdf/ficha-tecnica-from-aspirante";
import { formatDuracionPermiso, labelTipoPermiso } from "@src/lib/permisos";
import { format } from "date-fns";
import {
  boletaBanderaUri,
  boletaCefoaLogoUri,
  boletaEjercitoLogoUri,
} from "@src/lib/pdf/institution-logo";
import { prisma } from "@src/lib/prisma";
import type { Prisma } from "@src/generated/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

registerFichaTecnicaPdfFonts();

const CENSUS_KEYS = ["q", "sexo", "sort", "peloton", "convocatoria"] as const;
const BOLETA_RENDER_CHUNK = 20;

async function renderBoletasChunk(
  props: Omit<Parameters<typeof BoletasPermisoPdfDocument>[0], "part"> & {
    part: "all" | "boletas" | "control";
  },
) {
  const doc = createElement(BoletasPermisoPdfDocument, props);
  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
}

async function renderBoletasPdf(
  props: Omit<Parameters<typeof BoletasPermisoPdfDocument>[0], "part">,
) {
  if (props.cards.length <= BOLETA_RENDER_CHUNK) {
    return renderBoletasChunk({ ...props, part: "all" });
  }

  const merged = await PDFDocument.create();
  const append = async (part: "boletas" | "control", cards: typeof props.cards) => {
    const bytes = await renderBoletasChunk({ ...props, cards, part });
    const src = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    for (const page of pages) merged.addPage(page);
  };

  for (let i = 0; i < props.cards.length; i += BOLETA_RENDER_CHUNK) {
    await append("boletas", props.cards.slice(i, i + BOLETA_RENDER_CHUNK));
  }
  for (let i = 0; i < props.cards.length; i += BOLETA_RENDER_CHUNK) {
    await append("control", props.cards.slice(i, i + BOLETA_RENDER_CHUNK));
  }
  return Buffer.from(await merged.save());
}

function parseSp(searchParams: URLSearchParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const k of CENSUS_KEYS) {
    const v = searchParams.get(k);
    if (v !== null && v !== "") out[k] = v;
  }
  return out;
}

function safeFilePart(s: string) {
  return s.replace(/[^\w.-]+/g, "_").replace(/^\.+/, "").slice(0, 48) || "boletas";
}

const boletaInclude = {
  datosFisicos: {
    select: {
      colorCabello: true,
      tipoSangre: true,
      factorRh: true,
      colorOjos: true,
      colorPiel: true,
    },
  },
  contactos: {
    orderBy: { createdAt: "asc" as const },
    take: 3,
    select: { telefono: true, direccion: true },
  },
  permisos: {
    where: { anulado: false },
    orderBy: { fechaInicio: "asc" as const },
    select: { tipo: true, fechaInicio: true, fechaFin: true },
  },
} satisfies Prisma.AspiranteInclude;

type AspiranteBoletaRow = Prisma.AspiranteGetPayload<{ include: typeof boletaInclude }>;

async function resolveConvocatoriaId(sp: Record<string, string | undefined>): Promise<string | null> {
  const convocatorias = await prisma.convocatoria.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  if (!convocatorias.length) return null;
  const paramC = sp.convocatoria?.trim();
  if (paramC && convocatorias.some((c) => c.id === paramC)) return paramC;
  return convocatorias[0]!.id;
}

async function pdfResponse(
  userId: string | undefined,
  userEmail: string | null | undefined,
  aspirantes: AspiranteBoletaRow[],
) {
  if (!aspirantes.length) {
    return NextResponse.json({ message: "No hay personal para generar boletas." }, { status: 404 });
  }
  if (aspirantes.length > MAX_BOLETAS_PERMISO) {
    return NextResponse.json(
      { message: `Como máximo se pueden generar ${MAX_BOLETAS_PERMISO} boletas a la vez.` },
      { status: 400 },
    );
  }

  const convocatoriaId = aspirantes[0]!.convocatoriaId;
  const mixed = aspirantes.some((a) => a.convocatoriaId !== convocatoriaId);
  if (mixed) {
    return NextResponse.json(
      { message: "Seleccione personal de una sola convocatoria." },
      { status: 400 },
    );
  }

  const [convocatoria, rankingPeople] = await Promise.all([
    prisma.convocatoria.findUniqueOrThrow({ where: { id: convocatoriaId } }),
    prisma.aspirante.findMany({
      where: { convocatoriaId },
      select: { id: true, nombres: true, apellidos: true, cedula: true },
    }),
  ]);
  const logoCefoa = boletaCefoaLogoUri();
  const logoEjercito = boletaEjercitoLogoUri();
  const bandera = boletaBanderaUri();

  const ranks = boletaRankByApellidos(rankingPeople);
  const info = boletaConvocatoriaInfo(convocatoria);

  const cards = await mapWithConcurrency(aspirantes, 4, async (a): Promise<BoletaPermisoCard> => {
    const rasgos = boletaRasgosFromDatos(a.datosFisicos);
    const foto = await loadFotoForBoletaPdf(pickFotoForBoleta(a.fotoBoletaKey, a.fotoKey));
    const contacto = a.contactos[0];
    return {
      id: a.id,
      serial: formatBoletaSerial(ranks.get(a.id) ?? rankingPeople.length + 1),
      nombres: a.nombres,
      apellidos: a.apellidos,
      cedula: a.cedula,
      ...rasgos,
      direccion: a.direccion?.trim() || "—",
      telefono: formatTelefonoBoleta(a.telefono) ?? a.telefono?.trim() ?? "—",
      emergenciaDireccion: contacto?.direccion?.trim() || "—",
      emergenciaTelefono:
        formatTelefonoBoleta(contacto?.telefono) ?? contacto?.telefono?.trim() ?? "—",
      foto,
      control: a.permisos.map((p) => ({
        tipo: labelTipoPermiso(p.tipo),
        duracion: formatDuracionPermiso(p.fechaInicio, p.fechaFin),
        desde: format(p.fechaInicio, "dd/MM/yyyy"),
        hasta: format(p.fechaFin, "dd/MM/yyyy"),
      })),
    };
  });

  const ordered = [...cards].sort((a, b) => a.serial.localeCompare(b.serial, "es", { numeric: true }));

  let buffer: Buffer;
  try {
    buffer = await renderBoletasPdf({
      convocatoria: info,
      cards: ordered,
      logoCefoa,
      logoEjercito,
      bandera,
    });
  } catch (err) {
    console.error("BOLETA_PERMISO_PDF", err);
    return NextResponse.json(
      { message: "No se pudo generar el PDF de boletas. Intente de nuevo." },
      { status: 500 },
    );
  }

  await writeAuditLog({
    userId,
    userEmail,
    action: "BOLETA_PERMISO_PDF",
    entityType: "ASPIRANTE",
    entityId: ordered.length === 1 ? ordered[0]!.id : convocatoriaId,
    metadata: { count: ordered.length, convocatoriaId },
  });

  const filename =
    ordered.length === 1
      ? `boleta-permiso-${safeFilePart(ordered[0]!.cedula)}.pdf`
      : `boletas-permiso-${safeFilePart(convocatoria.codigo)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function loadByIds(ids: string[]) {
  if (!ids.length) return [] as AspiranteBoletaRow[];
  const rows = await prisma.aspirante.findMany({
    where: { id: { in: ids } },
    include: boletaInclude,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode")?.toLowerCase().trim();

  if (mode === "directorio") {
    if (!canWrite(ctx)) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }
    const sp = parseSp(url.searchParams);
    const convocatoriaId = await resolveConvocatoriaId(sp);
    if (!convocatoriaId) {
      return NextResponse.json({ message: "No hay convocatorias" }, { status: 404 });
    }
    const scopeConvocatoria = url.searchParams.get("scope")?.toLowerCase().trim() === "convocatoria";
    const where = scopeConvocatoria
      ? { convocatoriaId }
      : buildAspiranteCensusWhere(sp, convocatoriaId);
    const people = await prisma.aspirante.findMany({
      where,
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      select: { id: true, nombres: true, apellidos: true, cedula: true },
      take: MAX_BOLETAS_PERMISO,
    });
    return NextResponse.json({ people, convocatoriaId });
  }

  const ids = parseBoletaIdsParam(url.searchParams.get("ids"));
  if (ids.length === 1) {
    const aspirantes = await loadByIds(ids);
    return pdfResponse(session.user.id, session.user.email, aspirantes);
  }

  if (!canWrite(ctx)) {
    return NextResponse.json(
      { message: "No autorizado: el rol consulta no puede descargar boletas masivas." },
      { status: 403 },
    );
  }

  if (ids.length > 1) {
    const aspirantes = await loadByIds(ids);
    return pdfResponse(session.user.id, session.user.email, aspirantes);
  }

  const sp = parseSp(url.searchParams);
  const convocatoriaId = await resolveConvocatoriaId(sp);
  if (!convocatoriaId) {
    return NextResponse.json({ message: "No hay convocatorias" }, { status: 404 });
  }
  const scopeConvocatoria = url.searchParams.get("scope")?.toLowerCase().trim() === "convocatoria";
  const where = scopeConvocatoria
    ? { convocatoriaId }
    : buildAspiranteCensusWhere(sp, convocatoriaId);

  const aspirantes = await prisma.aspirante.findMany({
    where,
    include: boletaInclude,
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    take: MAX_BOLETAS_PERMISO + 1,
  });
  return pdfResponse(session.user.id, session.user.email, aspirantes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = parseBoletaIdsParam(body?.ids);
  if (!ids.length) {
    return NextResponse.json({ message: "Seleccione al menos un personal." }, { status: 400 });
  }
  if (ids.length > 1 && !canWrite(ctx)) {
    return NextResponse.json(
      { message: "No autorizado: el rol consulta no puede descargar boletas masivas." },
      { status: 403 },
    );
  }

  const aspirantes = await loadByIds(ids);
  return pdfResponse(session.user.id, session.user.email, aspirantes);
}
