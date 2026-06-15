import type { EstadoReporteInventario, TipoMovimientoInventario } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";

export const REPORTE_RANCHO_ESTADOS = ["QUEDA", "FALTA", "NO_HAY"] as const satisfies readonly EstadoReporteInventario[];

export type ReporteRanchoEstado = (typeof REPORTE_RANCHO_ESTADOS)[number];

export const REPORTE_ESTADO_LABELS: Record<ReporteRanchoEstado, string> = {
  QUEDA: "Queda",
  FALTA: "Falta",
  NO_HAY: "No hay",
};

export const REPORTE_ESTADO_DESCRIPTIONS: Record<ReporteRanchoEstado, string> = {
  QUEDA: "Existencias suficientes por encima del mínimo.",
  FALTA: "Por debajo del mínimo configurado; requiere reposición.",
  NO_HAY: "Sin existencias disponibles.",
};

export type ReporteRanchoMovimiento = {
  id: string;
  itemId: string;
  itemNombre: string;
  unidad: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string | null;
  stockAntes: number;
  stockDespues: number;
  createdAt: Date;
  userName: string | null;
};

export type ReporteRanchoPreviewLinea = {
  itemId: string;
  nombre: string;
  unidad: string;
  stockMinimo: number | null;
  stockAyer: number;
  stockReportado: number;
  entradas: number;
  salidas: number;
  estado: ReporteRanchoEstado;
};

export type ReporteRanchoDatos = {
  fecha: string;
  lineas: ReporteRanchoPreviewLinea[];
  movimientos: ReporteRanchoMovimiento[];
};

export type ReporteRanchoResumen = Record<ReporteRanchoEstado, number>;

export type FechaReporteOption = {
  value: string;
  label: string;
  isToday: boolean;
  yaReportado: boolean;
};

function startOfLocalDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(date: Date): Date {
  const d = startOfLocalDay(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseReporteFecha(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) {
    return null;
  }
  return startOfLocalDay(date);
}

export function getFechasReportePermitidas(): Date[] {
  const hoy = startOfLocalDay();
  const ayer = startOfLocalDay(new Date(hoy));
  ayer.setDate(ayer.getDate() - 1);
  return [hoy, ayer];
}

export function isFechaReportePermitida(date: Date): boolean {
  const key = toDateKey(startOfLocalDay(date));
  return getFechasReportePermitidas().some((f) => toDateKey(f) === key);
}

export function classifyInventarioEstado(
  stockActual: number,
  stockMinimo: number | null,
): ReporteRanchoEstado {
  if (stockActual <= 0) return "NO_HAY";
  if (stockMinimo != null && stockActual <= stockMinimo) return "FALTA";
  return "QUEDA";
}

export function resumirReporteLineas(lineas: Pick<ReporteRanchoPreviewLinea, "estado">[]): ReporteRanchoResumen {
  const resumen: ReporteRanchoResumen = { QUEDA: 0, FALTA: 0, NO_HAY: 0 };
  for (const linea of lineas) {
    resumen[linea.estado] += 1;
  }
  return resumen;
}

function netMovimiento(tipo: TipoMovimientoInventario, cantidad: number): number {
  return tipo === "ENTRADA" ? cantidad : -cantidad;
}

async function getMovimientosRanchoEnRango(desde: Date, hasta: Date): Promise<ReporteRanchoMovimiento[]> {
  const rows = await prisma.inventarioMovimiento.findMany({
    where: {
      item: { area: "RANCHO" },
      createdAt: { gte: desde, lte: hasta },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      itemId: true,
      tipo: true,
      cantidad: true,
      motivo: true,
      stockAntes: true,
      stockDespues: true,
      createdAt: true,
      item: { select: { nombre: true, unidad: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    itemId: row.itemId,
    itemNombre: row.item.nombre,
    unidad: row.item.unidad,
    tipo: row.tipo,
    cantidad: row.cantidad,
    motivo: row.motivo,
    stockAntes: row.stockAntes,
    stockDespues: row.stockDespues,
    createdAt: row.createdAt,
    userName: row.user?.name ?? row.user?.email ?? null,
  }));
}

function sumMovimientosPorItem(movimientos: ReporteRanchoMovimiento[]) {
  const map = new Map<string, { entradas: number; salidas: number; neto: number }>();
  for (const mov of movimientos) {
    const prev = map.get(mov.itemId) ?? { entradas: 0, salidas: 0, neto: 0 };
    if (mov.tipo === "ENTRADA") {
      prev.entradas += mov.cantidad;
    } else {
      prev.salidas += mov.cantidad;
    }
    prev.neto += netMovimiento(mov.tipo, mov.cantidad);
    map.set(mov.itemId, prev);
  }
  return map;
}

async function getStockActualAjustado(fechaReporte: Date): Promise<Map<string, number>> {
  const hoy = startOfLocalDay();
  const fechaKey = toDateKey(fechaReporte);
  const hoyKey = toDateKey(hoy);

  const items = await prisma.inventarioItem.findMany({
    where: { area: "RANCHO", activo: true },
    select: { id: true, stockActual: true },
  });

  const map = new Map(items.map((i) => [i.id, i.stockActual]));

  if (fechaKey !== hoyKey) {
    const movimientosHoy = await getMovimientosRanchoEnRango(hoy, endOfLocalDay(hoy));
    const netHoy = sumMovimientosPorItem(movimientosHoy);
    for (const item of items) {
      const delta = netHoy.get(item.id)?.neto ?? 0;
      map.set(item.id, item.stockActual - delta);
    }
  }

  return map;
}

export async function buildReporteRanchoDatos(fechaReporte: Date): Promise<ReporteRanchoDatos> {
  const dayStart = startOfLocalDay(fechaReporte);
  const dayEnd = endOfLocalDay(fechaReporte);

  const [items, movimientos, stockAjustado] = await Promise.all([
    prisma.inventarioItem.findMany({
      where: { area: "RANCHO", activo: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        unidad: true,
        stockMinimo: true,
      },
    }),
    getMovimientosRanchoEnRango(dayStart, dayEnd),
    getStockActualAjustado(fechaReporte),
  ]);

  const movPorItem = sumMovimientosPorItem(movimientos);

  const lineas: ReporteRanchoPreviewLinea[] = items.map((item) => {
    const stockReportado = stockAjustado.get(item.id) ?? 0;
    const mov = movPorItem.get(item.id) ?? { entradas: 0, salidas: 0, neto: 0 };
    const stockAyer = stockReportado - mov.neto;

    return {
      itemId: item.id,
      nombre: item.nombre,
      unidad: item.unidad,
      stockMinimo: item.stockMinimo,
      stockAyer,
      stockReportado,
      entradas: mov.entradas,
      salidas: mov.salidas,
      estado: classifyInventarioEstado(stockReportado, item.stockMinimo),
    };
  });

  return {
    fecha: toDateKey(fechaReporte),
    lineas,
    movimientos,
  };
}

export async function getReporteRanchoPreview(): Promise<ReporteRanchoDatos> {
  return buildReporteRanchoDatos(startOfLocalDay());
}

export async function getReportesRanchoPreviews(): Promise<Record<string, ReporteRanchoDatos>> {
  const fechas = getFechasReportePermitidas();
  const entries = await Promise.all(
    fechas.map(async (fecha) => {
      const key = toDateKey(fecha);
      return [key, await buildReporteRanchoDatos(fecha)] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function getReportesRanchoFechasRegistradas(): Promise<Set<string>> {
  const fechas = await prisma.inventarioReporteRancho.findMany({
    select: { fecha: true },
  });
  return new Set(fechas.map((r) => toDateKey(startOfLocalDay(r.fecha))));
}

export async function getFechasReporteOptions(): Promise<FechaReporteOption[]> {
  const registradas = await getReportesRanchoFechasRegistradas();
  const hoy = startOfLocalDay();

  return getFechasReportePermitidas().map((fecha) => {
    const value = toDateKey(fecha);
    const isToday = value === toDateKey(hoy);
    return {
      value,
      label: isToday ? "Hoy" : "Ayer",
      isToday,
      yaReportado: registradas.has(value),
    };
  });
}

const REPORTE_LIST_LIMIT = 30;

export async function getReportesRanchoList() {
  return prisma.inventarioReporteRancho.findMany({
    orderBy: { fecha: "desc" },
    take: REPORTE_LIST_LIMIT,
    select: {
      id: true,
      fecha: true,
      notas: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      lineas: { select: { estado: true } },
    },
  });
}

export async function getReporteRanchoById(id: string) {
  const reporte = await prisma.inventarioReporteRancho.findUnique({
    where: { id },
    select: {
      id: true,
      fecha: true,
      notas: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      lineas: {
        orderBy: [{ estado: "asc" }, { nombre: "asc" }],
        select: {
          id: true,
          itemId: true,
          nombre: true,
          unidad: true,
          stockMinimo: true,
          stockAyer: true,
          stockReportado: true,
          estado: true,
        },
      },
    },
  });

  if (!reporte) return null;

  const movimientos = await getMovimientosRanchoEnRango(
    startOfLocalDay(reporte.fecha),
    endOfLocalDay(reporte.fecha),
  );

  const lineas = reporte.lineas.map((linea) => {
    const movs = movimientos.filter((m) => m.itemId === linea.itemId);
    let entradas = 0;
    let salidas = 0;
    for (const mov of movs) {
      if (mov.tipo === "ENTRADA") entradas += mov.cantidad;
      else salidas += mov.cantidad;
    }
    return { ...linea, entradas, salidas };
  });

  return { ...reporte, lineas, movimientos };
}

export async function getReporteRanchoByFecha(fecha: Date) {
  return prisma.inventarioReporteRancho.findUnique({
    where: { fecha: startOfLocalDay(fecha) },
    select: { id: true },
  });
}

export { toDateKey, startOfLocalDay, endOfLocalDay };
