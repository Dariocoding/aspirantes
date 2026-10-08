import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { isMembreteLogoKind, type MembreteLogoKind } from "@src/lib/membrete";
import { inlinePdfResponse, pdfNoEncontrado } from "@src/lib/pdf/inline-pdf";
import { boletaCefoaLogoUri, boletaEjercitoLogoUri } from "@src/lib/pdf/institution-logo";
import { OrdenDelDiaPdfFile } from "@src/lib/pdf/orden-del-dia-file";
import { registerFichaTecnicaPdfFonts } from "@src/lib/pdf/register-ficha-tecnica-fonts";
import {
  buildOrdenDelDia,
  type OrdenDelDiaData,
  type PlanOrdenInput,
} from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import type { OrdenNocturnoConfig } from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import { loadOrdenNocturnoConfig } from "@src/lib/roles-servicio/orden-del-dia/load-config-nocturno";
import { siguienteDia } from "@src/lib/roles-servicio/orden-del-dia/fechas";
import { diasDelMes, etiquetaMes, marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import { prisma } from "@src/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 120;

registerFichaTecnicaPdfFonts();

function logoUri(kind: MembreteLogoKind): string | null {
  if (kind === "cefoa") return boletaCefoaLogoUri();
  if (kind === "ejercito") return boletaEjercitoLogoUri();
  return null;
}

function parseEntero(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function cargarPlanes(anio: number, mes: number): Promise<PlanOrdenInput[]> {
  const planesDb = await prisma.planRolServicio.findMany({
    where: { anio, mes },
    orderBy: { rol: { sortOrder: "asc" } },
    include: {
      rol: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        include: {
          aspirante: { select: { nombres: true, apellidos: true } },
          autoridad: { select: { nombres: true, apellidos: true, jerarquia: true } },
        },
      },
    },
  });

  return planesDb.map((plan) => ({
    clave: plan.rol.clave,
    nombre: plan.rol.nombre,
    curso: plan.rol.curso,
    asignaciones: plan.asignaciones.map((asignacion) => ({
      orden: asignacion.orden,
      grado: asignacion.grado,
      nombre: asignacion.nombre,
      dias: marcasDesdeJson(asignacion.dias),
      aspirante: asignacion.aspirante,
      autoridad: asignacion.autoridad,
    })),
  }));
}

function construirOrdenesMes(input: {
  anio: number;
  mes: number;
  planes: PlanOrdenInput[];
  planesMesAnterior: PlanOrdenInput[];
  planesMesSiguiente: PlanOrdenInput[];
  lineasMembrete?: string[];
  directorNombre?: string | null;
  nocturnoConfig: OrdenNocturnoConfig;
}): OrdenDelDiaData[] {
  const total = diasDelMes(input.anio, input.mes);
  const ordenes: OrdenDelDiaData[] = [];
  for (let dia = 1; dia <= total; dia += 1) {
    const diurno = siguienteDia(input.anio, input.mes, dia);
    if (!diurno) continue;
    const mismoMes = diurno.anio === input.anio && diurno.mes === input.mes;
    ordenes.push(
      buildOrdenDelDia({
        anio: diurno.anio,
        mes: diurno.mes,
        dia: diurno.dia,
        planes: mismoMes ? input.planes : input.planesMesSiguiente,
        planesMesAnterior: mismoMes ? input.planesMesAnterior : input.planes,
        lineasMembrete: input.lineasMembrete,
        directorNombre: input.directorNombre,
        nocturnoConfig: input.nocturnoConfig,
      }),
    );
  }
  return ordenes;
}

export async function GET(request: Request) {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    pdfNoEncontrado();
  }

  const url = new URL(request.url);
  const hoy = new Date();
  const anio = parseEntero(url.searchParams.get("anio"), hoy.getFullYear());
  const mes = parseEntero(url.searchParams.get("mes"), hoy.getMonth() + 1);
  const ambitoRaw = (url.searchParams.get("ambito") ?? "dia").toLowerCase();
  const ambito = ambitoRaw === "mes" ? "mes" : "dia";

  if (mes < 1 || mes > 12) {
    return NextResponse.json({ message: "Fecha inválida" }, { status: 400 });
  }

  const totalDias = diasDelMes(anio, mes);
  const dia = parseEntero(url.searchParams.get("dia"), hoy.getDate());
  if (ambito === "dia" && (dia < 1 || dia > totalDias)) {
    return NextResponse.json({ message: "Fecha inválida" }, { status: 400 });
  }

  const [planes, membrete, convocatoria, nocturnoConfig] = await Promise.all([
    cargarPlanes(anio, mes),
    prisma.membrete.findFirst({
      where: { isDefault: true },
      orderBy: { nombre: "asc" },
    }),
    getConvocatoriaActiva(),
    loadOrdenNocturnoConfig(),
  ]);

  if (planes.length === 0) {
    return NextResponse.json(
      { message: "No hay roles de servicio publicados para ese mes" },
      { status: 404 },
    );
  }

  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anioAnterior = mes === 1 ? anio - 1 : anio;
  const mesSiguiente = mes === 12 ? 1 : mes + 1;
  const anioSiguiente = mes === 12 ? anio + 1 : anio;
  const [planesMesAnterior, planesMesSiguiente] = await Promise.all([
    cargarPlanes(anioAnterior, mesAnterior),
    cargarPlanes(anioSiguiente, mesSiguiente),
  ]);

  const logoIzqKind: MembreteLogoKind =
    membrete && isMembreteLogoKind(membrete.logoIzq) ? membrete.logoIzq : "ejercito";
  const logoDerKind: MembreteLogoKind =
    membrete && isMembreteLogoKind(membrete.logoDer) ? membrete.logoDer : "cefoa";

  const comunes = {
    planes,
    planesMesAnterior,
    planesMesSiguiente,
    lineasMembrete: membrete?.lineas,
    directorNombre: convocatoria?.comandanteNombre,
    nocturnoConfig,
  };

  const ordenes =
    ambito === "mes"
      ? construirOrdenesMes({ anio, mes, ...comunes })
      : [
          buildOrdenDelDia({
            anio,
            mes,
            dia,
            planes,
            planesMesAnterior,
            lineasMembrete: comunes.lineasMembrete,
            directorNombre: comunes.directorNombre,
            nocturnoConfig,
          }),
        ];

  const mesLabel = etiquetaMes(anio, mes);
  const titulo =
    ambito === "mes"
      ? `Órdenes del día · ${mesLabel}`
      : `Orden del Día Nº ${ordenes[0]?.numeroOrden ?? dia}`;

  let buffer: Buffer;
  try {
    const doc = createElement(OrdenDelDiaPdfFile, {
      ordenes,
      logoIzq: logoUri(logoIzqKind),
      logoDer: logoUri(logoDerKind),
      titulo,
    });
    buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  } catch (error) {
    console.error("[orden-del-dia/pdf]", error);
    return NextResponse.json({ message: "No se pudo generar el PDF" }, { status: 500 });
  }

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action:
      ambito === "mes"
        ? "ROLES_SERVICIO_ORDENES_MES_PDF"
        : "ROLES_SERVICIO_ORDEN_DEL_DIA_PDF",
    entityType: "PLAN_ROL_SERVICIO",
    entityId:
      ambito === "mes"
        ? `${anio}-${String(mes).padStart(2, "0")}`
        : `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
    metadata: {
      anio,
      mes,
      dia: ambito === "dia" ? dia : undefined,
      ambito,
      ordenes: ordenes.length,
    },
  });

  const filename =
    ambito === "mes"
      ? `ordenes-del-dia-${anio}-${String(mes).padStart(2, "0")}.pdf`
      : `orden-del-dia-${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}.pdf`;

  return inlinePdfResponse(buffer, filename);
}
