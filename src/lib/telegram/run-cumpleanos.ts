import type { PrismaClient } from "@src/generated/prisma";
import { sendTelegramMessage } from "@src/lib/telegram/client";
import {
  cargarAvisosCumpleanos,
  formatAvisosCumpleanos,
} from "@src/lib/telegram/cumpleanos";
import { fechaEnCaracas } from "@src/lib/telegram/load-orden-hoy";

export async function ejecutarEnvioCumpleanos(
  db: PrismaClient,
  opts?: { dryRun?: boolean },
) {
  const hoy = fechaEnCaracas();
  const avisos = await cargarAvisosCumpleanos(db, hoy);
  const texto = formatAvisosCumpleanos(avisos);
  const total = avisos.reduce((n, a) => n + a.personas.length, 0);

  if (!texto) {
    return {
      ok: true as const,
      dryRun: Boolean(opts?.dryRun),
      fecha: hoy,
      enviados: 0,
      totalPersonas: 0,
      avisos: avisos.map((a) => ({
        offset: a.offset,
        etiqueta: a.etiqueta,
        cantidad: a.personas.length,
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
      totalPersonas: total,
      avisos: avisos.map((a) => ({
        offset: a.offset,
        etiqueta: a.etiqueta,
        cantidad: a.personas.length,
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
    totalPersonas: total,
    avisos: avisos.map((a) => ({
      offset: a.offset,
      etiqueta: a.etiqueta,
      cantidad: a.personas.length,
    })),
    texto,
    messageId: enviado.messageId,
  };
}
