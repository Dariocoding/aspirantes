import type { PrismaClient } from "@src/generated/prisma";
import { sendTelegramMessage } from "@src/lib/telegram/client";
import {
  cargarAvisosEfemerides,
  formatAvisosEfemerides,
} from "@src/lib/telegram/efemerides";
import { fechaEnCaracas } from "@src/lib/telegram/load-orden-hoy";

export async function ejecutarEnvioEfemerides(
  db: PrismaClient,
  opts?: { dryRun?: boolean },
) {
  const hoy = fechaEnCaracas();
  const avisos = await cargarAvisosEfemerides(db, hoy);
  const texto = formatAvisosEfemerides(avisos);
  const total = avisos.reduce((n, a) => n + a.items.length, 0);

  if (!texto) {
    return {
      ok: true as const,
      dryRun: Boolean(opts?.dryRun),
      fecha: hoy,
      enviados: 0,
      totalItems: 0,
      avisos: avisos.map((a) => ({
        offset: a.offset,
        etiqueta: a.etiqueta,
        cantidad: a.items.length,
      })),
      texto: null as string | null,
      messageId: null as number | null,
    };
  }

  if (opts?.dryRun) {
    return {
      ok: true as const,
      dryRun: true as const,
      fecha: hoy,
      enviados: 0,
      totalItems: total,
      avisos: avisos.map((a) => ({
        offset: a.offset,
        etiqueta: a.etiqueta,
        cantidad: a.items.length,
      })),
      texto,
      messageId: null as number | null,
    };
  }

  const enviado = await sendTelegramMessage(texto);
  return {
    ok: true as const,
    dryRun: false as const,
    fecha: hoy,
    enviados: 1,
    totalItems: total,
    avisos: avisos.map((a) => ({
      offset: a.offset,
      etiqueta: a.etiqueta,
      cantidad: a.items.length,
    })),
    texto,
    messageId: enviado.messageId,
  };
}
