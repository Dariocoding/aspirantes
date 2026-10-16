import type { PrismaClient } from "@src/generated/prisma";
import { siguienteDia } from "@src/lib/roles-servicio/orden-del-dia/fechas";
import { sendTelegramMessage } from "@src/lib/telegram/client";
import {
  formatRecordatorioNocturno,
  formatServiciosDiurnos,
  formatServiciosManana,
} from "@src/lib/telegram/format-servicios";
import {
  fechaEnCaracas,
  loadOrdenTelegramDia,
  type FechaCaracas,
} from "@src/lib/telegram/load-orden-hoy";

/** Modos del cron automático. */
export type ModoEnvioCron = "servicios-manana" | "recordatorio-nocturno";

/** Modos del botón manual en la vista. */
export type ModoEnvioManual = "hoy" | "esta-noche" | "manana";

export type ModoEnvioTelegram = ModoEnvioCron | ModoEnvioManual;

function armarTexto(
  modo: ModoEnvioTelegram,
  fecha: FechaCaracas,
  ordenDiurno: Awaited<ReturnType<typeof loadOrdenTelegramDia>>["ordenDiurno"],
  ordenNocturnoDelDia: Awaited<ReturnType<typeof loadOrdenTelegramDia>>["ordenNocturnoDelDia"],
): string {
  switch (modo) {
    case "hoy":
      return formatServiciosDiurnos({
        titulo: "Servicio diurno de hoy",
        anio: fecha.anio,
        mes: fecha.mes,
        dia: fecha.dia,
        diurnos: ordenDiurno,
      });
    case "esta-noche":
    case "recordatorio-nocturno":
      return formatRecordatorioNocturno({
        titulo: modo === "esta-noche" ? "Servicio de esta noche" : "Recordatorio nocturno",
        anio: fecha.anio,
        mes: fecha.mes,
        dia: fecha.dia,
        nocturnos: ordenNocturnoDelDia,
      });
    case "manana":
      return formatServiciosDiurnos({
        titulo: "Servicio diurno de mañana",
        anio: fecha.anio,
        mes: fecha.mes,
        dia: fecha.dia,
        diurnos: ordenDiurno,
      });
    case "servicios-manana":
      return formatServiciosManana({
        anio: fecha.anio,
        mes: fecha.mes,
        dia: fecha.dia,
        diurnos: ordenDiurno,
        nocturnos: ordenNocturnoDelDia,
      });
  }
}

export async function ejecutarEnvioTelegram(
  db: PrismaClient,
  modo: ModoEnvioTelegram,
  opts?: { dryRun?: boolean },
) {
  const hoy = fechaEnCaracas();
  let fechaObjetivo = hoy;

  if (modo === "manana") {
    const manana = siguienteDia(hoy.anio, hoy.mes, hoy.dia);
    if (!manana) throw new Error("No se pudo calcular mañana");
    fechaObjetivo = manana;
  }

  const { fecha, ordenDiurno, ordenNocturnoDelDia } = await loadOrdenTelegramDia(
    db,
    fechaObjetivo,
  );

  const texto = armarTexto(modo, fecha, ordenDiurno, ordenNocturnoDelDia);

  if (opts?.dryRun) {
    return {
      ok: true as const,
      dryRun: true as const,
      fecha,
      modo,
      texto,
      diurnos: ordenDiurno.diurnos.length,
      nocturnos: ordenNocturnoDelDia.nocturnos.length,
    };
  }

  const enviado = await sendTelegramMessage(texto);
  return {
    ok: true as const,
    dryRun: false as const,
    fecha,
    modo,
    messageId: enviado.messageId,
    diurnos: ordenDiurno.diurnos.length,
    nocturnos: ordenNocturnoDelDia.nocturnos.length,
  };
}
