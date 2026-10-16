import type { OrdenDelDiaData } from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import { etiquetaFechaOrden } from "@src/lib/roles-servicio/orden-del-dia/fechas";
import {
  encabezadoInstitucional,
  escapeHtml,
  lineaFecha,
  lineaSeccion,
  nroPad,
  pieMilitar,
  SEP_FINA,
} from "@src/lib/telegram/format-militar";

function bloqueDiurnos(orden: OrdenDelDiaData): string {
  if (orden.diurnos.length === 0) {
    return "<i>Sin personal designado para el servicio diurno.</i>";
  }

  const lineas: string[] = [];
  for (const fila of orden.diurnos) {
    lineas.push(
      `<b>${nroPad(fila.nro)}.</b> <b>${escapeHtml(fila.servicio)}</b>`,
      `     <code>${escapeHtml(fila.grado)}</code>`,
      `     ${escapeHtml(fila.nombres)}`,
      "",
    );
  }
  return lineas.join("\n").trimEnd();
}

function bloqueNocturnos(orden: OrdenDelDiaData): string {
  if (orden.nocturnos.length === 0) {
    return "<i>Sin personal designado para el servicio nocturno.</i>";
  }

  const lineas: string[] = [];
  for (const fila of orden.nocturnos) {
    const turno = fila.turno?.trim();
    lineas.push(`<b>${nroPad(fila.nro)}.</b> <b>${escapeHtml(fila.servicio)}</b>`);
    if (turno) lineas.push(`     <b>TURNO:</b> ${escapeHtml(turno)}`);
    lineas.push(
      `     <code>${escapeHtml(fila.grado)}</code>`,
      `     ${escapeHtml(fila.nombres)}`,
      "",
    );
  }
  return lineas.join("\n").trimEnd();
}

function resumenConteo(diurnos: number, nocturnos?: number): string {
  if (nocturnos == null) {
    return `<b>EFECTIVO:</b> ${diurnos} designado${diurnos === 1 ? "" : "s"}`;
  }
  return `<b>EFECTIVO:</b> ${diurnos} diurno${diurnos === 1 ? "" : "s"} · ${nocturnos} nocturno${nocturnos === 1 ? "" : "s"}`;
}

/** Mensaje 07:00 — diurnos del día + nocturnos de esa misma noche. */
export function formatServiciosManana(input: {
  anio: number;
  mes: number;
  dia: number;
  diurnos: OrdenDelDiaData;
  nocturnos: OrdenDelDiaData;
}): string {
  const fecha = etiquetaFechaOrden(input.anio, input.mes, input.dia);
  const nDiurnos = input.diurnos.diurnos.length;
  const nNocturnos = input.nocturnos.nocturnos.length;

  return [
    ...encabezadoInstitucional("ROL DE SERVICIO DEL DÍA"),
    lineaFecha(fecha),
    resumenConteo(nDiurnos, nNocturnos),
    ...lineaSeccion("I", "Servicio diurno"),
    bloqueDiurnos(input.diurnos),
    ...lineaSeccion("II", "Servicio nocturno"),
    bloqueNocturnos(input.nocturnos),
    ...pieMilitar("Presentarse puntual, uniforme completo y listo para el servicio."),
  ].join("\n");
}

/** Solo diurnos (hoy / mañana desde la UI). */
export function formatServiciosDiurnos(input: {
  titulo: string;
  anio: number;
  mes: number;
  dia: number;
  diurnos: OrdenDelDiaData;
}): string {
  const fecha = etiquetaFechaOrden(input.anio, input.mes, input.dia);
  const n = input.diurnos.diurnos.length;

  return [
    ...encabezadoInstitucional(input.titulo),
    lineaFecha(fecha),
    resumenConteo(n),
    "",
    SEP_FINA,
    bloqueDiurnos(input.diurnos),
    ...pieMilitar("Presentarse puntual, uniforme completo y listo para el servicio."),
  ].join("\n");
}

/** Mensaje 18:00 / botón “esta noche” — solo nocturnos del día. */
export function formatRecordatorioNocturno(input: {
  anio: number;
  mes: number;
  dia: number;
  nocturnos: OrdenDelDiaData;
  titulo?: string;
}): string {
  const fecha = etiquetaFechaOrden(input.anio, input.mes, input.dia);
  const n = input.nocturnos.nocturnos.length;

  return [
    ...encabezadoInstitucional(input.titulo ?? "Recordatorio servicio nocturno"),
    lineaFecha(fecha),
    `<b>EFECTIVO NOCTURNO:</b> ${n} designado${n === 1 ? "" : "s"}`,
    "",
    SEP_FINA,
    bloqueNocturnos(input.nocturnos),
    ...pieMilitar(
      "Recordatorio: verificar turno, armamento y relevo. Mantener vigilancia continua.",
    ),
  ].join("\n");
}
