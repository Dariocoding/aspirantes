import type { PrismaClient } from "@src/generated/prisma";
import { sendTelegramMessage } from "@src/lib/telegram/client";
import {
  formatRecordatorioNocturno,
  formatServiciosManana,
} from "@src/lib/telegram/format-servicios";
import { loadOrdenTelegramDia } from "@src/lib/telegram/load-orden-hoy";

export type ModoEnvioTelegram = "servicios-manana" | "recordatorio-nocturno";

export async function ejecutarEnvioTelegram(
  db: PrismaClient,
  modo: ModoEnvioTelegram,
  opts?: { dryRun?: boolean },
) {
  const { fecha, ordenDiurno, ordenNocturnoDelDia } = await loadOrdenTelegramDia(db);

  const texto =
    modo === "servicios-manana"
      ? formatServiciosManana({
          anio: fecha.anio,
          mes: fecha.mes,
          dia: fecha.dia,
          diurnos: ordenDiurno,
          nocturnos: ordenNocturnoDelDia,
        })
      : formatRecordatorioNocturno({
          anio: fecha.anio,
          mes: fecha.mes,
          dia: fecha.dia,
          nocturnos: ordenNocturnoDelDia,
        });

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
