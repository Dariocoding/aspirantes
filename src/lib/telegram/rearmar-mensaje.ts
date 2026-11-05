import type { PrismaClient } from "@src/generated/prisma";
import { cargarAvisosCumpleanos, formatAvisosCumpleanos } from "@src/lib/telegram/cumpleanos";
import { cargarAvisosEfemerides, formatAvisosEfemerides } from "@src/lib/telegram/efemerides";
import type { FechaCaracas } from "@src/lib/telegram/load-orden-hoy";
import { construirTextoTelegram, type ModoEnvioTelegram } from "@src/lib/telegram/run-envio";

const MODOS_SERVICIO = new Set<ModoEnvioTelegram>([
  "hoy",
  "esta-noche",
  "manana",
  "servicios-manana",
  "recordatorio-nocturno",
]);

function esModoServicio(tipo: string): tipo is ModoEnvioTelegram {
  return MODOS_SERVICIO.has(tipo as ModoEnvioTelegram);
}

/** Vuelve a armar el texto con los datos actuales de esa fecha. No publica nada. */
export async function rearmarTextoMensaje(
  db: PrismaClient,
  mensaje: { tipo: string; anio: number; mes: number; dia: number },
): Promise<string | null> {
  const fecha: FechaCaracas = { anio: mensaje.anio, mes: mensaje.mes, dia: mensaje.dia };

  if (esModoServicio(mensaje.tipo)) {
    return construirTextoTelegram(db, mensaje.tipo, fecha);
  }
  if (mensaje.tipo === "cumpleanos") {
    return formatAvisosCumpleanos(await cargarAvisosCumpleanos(db, fecha));
  }
  if (mensaje.tipo === "efemerides") {
    return formatAvisosEfemerides(await cargarAvisosEfemerides(db, fecha));
  }
  return null;
}
