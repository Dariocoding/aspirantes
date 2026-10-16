import type { OrdenDelDiaData } from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import { etiquetaFechaOrden } from "@src/lib/roles-servicio/orden-del-dia/fechas";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function bloqueDiurnos(orden: OrdenDelDiaData): string {
  const lineas = [`<b>DIURNOS</b>`];
  if (orden.diurnos.length === 0) {
    lineas.push("<i>Sin asignaciones</i>");
    return lineas.join("\n");
  }
  for (const fila of orden.diurnos) {
    lineas.push(
      `${fila.nro}. <b>${escapeHtml(fila.servicio)}</b>\n` +
        `   ${escapeHtml(fila.grado)} — ${escapeHtml(fila.nombres)}`,
    );
  }
  return lineas.join("\n");
}

function bloqueNocturnos(orden: OrdenDelDiaData): string {
  const lineas = [`<b>NOCTURNOS</b>`];
  if (orden.nocturnos.length === 0) {
    lineas.push("<i>Sin asignaciones</i>");
    return lineas.join("\n");
  }
  for (const fila of orden.nocturnos) {
    const turno = fila.turno?.trim() ? ` (${escapeHtml(fila.turno)})` : "";
    lineas.push(
      `${fila.nro}. <b>${escapeHtml(fila.servicio)}</b>${turno}\n` +
        `   ${escapeHtml(fila.grado)} — ${escapeHtml(fila.nombres)}`,
    );
  }
  return lineas.join("\n");
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
  return [
    `<b>Servicios del día</b>`,
    escapeHtml(fecha),
    "",
    bloqueDiurnos(input.diurnos),
    "",
    bloqueNocturnos(input.nocturnos),
  ].join("\n");
}

/** Mensaje 18:00 — solo nocturnos del día. */
export function formatRecordatorioNocturno(input: {
  anio: number;
  mes: number;
  dia: number;
  nocturnos: OrdenDelDiaData;
}): string {
  const fecha = etiquetaFechaOrden(input.anio, input.mes, input.dia);
  return [
    `<b>Recordatorio nocturno</b>`,
    escapeHtml(fecha),
    "",
    bloqueNocturnos(input.nocturnos),
  ].join("\n");
}
