import type { EstadoReporteInventario, TipoMovimientoInventario } from "@src/generated/prisma";

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

export function startOfLocalDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalDay(date: Date): Date {
  const d = startOfLocalDay(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function toDateKey(date: Date): string {
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
