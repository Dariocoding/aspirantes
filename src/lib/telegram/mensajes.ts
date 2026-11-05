import type { Prisma } from "@src/generated/prisma";
import { prisma } from "@src/lib/prisma";
import { resolveTelegramCredentials } from "@src/lib/telegram/credenciales";
import type { MensajeTelegramLista } from "@src/lib/telegram/mensajes-tipos";

export type { MensajeTelegramLista } from "@src/lib/telegram/mensajes-tipos";
export { LIMITE_TEXTO_TELEGRAM } from "@src/lib/telegram/mensajes-tipos";

const ETIQUETAS: Record<string, string> = {
  hoy: "Servicio de hoy",
  "esta-noche": "Servicio de esta noche",
  manana: "Servicio de mañana",
  "servicios-manana": "Rol del día",
  "recordatorio-nocturno": "Recordatorio nocturno",
  cumpleanos: "Cumpleaños",
  efemerides: "Efemérides",
};

const ACCIONES_AUDITORIA = [
  "TELEGRAM_SERVICIOS_ENVIAR",
  "TELEGRAM_CUMPLEANOS_ENVIAR",
  "TELEGRAM_EFEMERIDES_ENVIAR",
] as const;

export function etiquetaTipoTelegram(tipo: string): string {
  return ETIQUETAS[tipo] ?? "Mensaje";
}

export async function registrarMensajeTelegram(input: {
  chatId: string;
  messageId: number;
  tipo: string;
  texto: string;
  fecha: { anio: number; mes: number; dia: number };
}): Promise<void> {
  await prisma.telegramMensaje.upsert({
    where: {
      chatId_messageId: { chatId: input.chatId, messageId: input.messageId },
    },
    create: {
      chatId: input.chatId,
      messageId: input.messageId,
      tipo: input.tipo,
      texto: input.texto,
      anio: input.fecha.anio,
      mes: input.fecha.mes,
      dia: input.fecha.dia,
    },
    update: {
      tipo: input.tipo,
      texto: input.texto,
      anio: input.fecha.anio,
      mes: input.fecha.mes,
      dia: input.fecha.dia,
    },
  });
}

function tipoDesdeAuditoria(action: string, modo: string | undefined): string | null {
  if (action === "TELEGRAM_CUMPLEANOS_ENVIAR") return "cumpleanos";
  if (action === "TELEGRAM_EFEMERIDES_ENVIAR") return "efemerides";
  if (action === "TELEGRAM_SERVICIOS_ENVIAR" && modo && modo in ETIQUETAS) return modo;
  return null;
}

function fechaDesdeEntityId(entityId: string | null): { anio: number; mes: number; dia: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entityId ?? "");
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { anio, mes, dia };
}

function metaAuditoria(value: Prisma.JsonValue | null): { messageId: number; modo?: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const messageId = Number((value as { messageId?: unknown }).messageId);
  if (!Number.isInteger(messageId) || messageId <= 0) return null;
  const modo = (value as { modo?: unknown }).modo;
  return { messageId, modo: typeof modo === "string" ? modo : undefined };
}

/** Recupera message_id de envíos anteriores a este registro, para poder editarlos. */
async function importarDesdeAuditoria(chatId: string): Promise<void> {
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: [...ACCIONES_AUDITORIA] } },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { action: true, entityId: true, metadata: true, createdAt: true },
  });

  const candidatos: {
    messageId: number;
    tipo: string;
    anio: number;
    mes: number;
    dia: number;
    createdAt: Date;
  }[] = [];

  for (const log of logs) {
    const meta = metaAuditoria(log.metadata);
    const fecha = fechaDesdeEntityId(log.entityId);
    const tipo = meta ? tipoDesdeAuditoria(log.action, meta.modo) : null;
    if (!meta || !fecha || !tipo) continue;
    candidatos.push({ messageId: meta.messageId, tipo, ...fecha, createdAt: log.createdAt });
  }
  if (candidatos.length === 0) return;

  const vistos = new Set<number>();
  const unicos = candidatos.filter((item) => {
    if (vistos.has(item.messageId)) return false;
    vistos.add(item.messageId);
    return true;
  });
  if (unicos.length === 0) return;

  const ya = new Set(
    (
      await prisma.telegramMensaje.findMany({
        where: { chatId, messageId: { in: unicos.map((item) => item.messageId) } },
        select: { messageId: true },
      })
    ).map((item) => item.messageId),
  );

  const nuevos = unicos.filter((item) => !ya.has(item.messageId));
  if (nuevos.length === 0) return;

  await prisma.telegramMensaje.createMany({
    data: nuevos.map((item) => ({
      chatId,
      messageId: item.messageId,
      tipo: item.tipo,
      texto: "",
      anio: item.anio,
      mes: item.mes,
      dia: item.dia,
      createdAt: item.createdAt,
    })),
  });
}

export async function listarMensajesTelegram(): Promise<MensajeTelegramLista[]> {
  const credenciales = await resolveTelegramCredentials();
  if (!credenciales) return [];

  try {
    await importarDesdeAuditoria(credenciales.chatId);
  } catch (error) {
    console.error("[telegram-mensaje-importar]", error);
  }

  const filas = await prisma.telegramMensaje.findMany({
    where: { chatId: credenciales.chatId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return filas.map((fila) => ({
    id: fila.id,
    tipo: fila.tipo,
    etiqueta: etiquetaTipoTelegram(fila.tipo),
    texto: fila.texto,
    anio: fila.anio,
    mes: fila.mes,
    dia: fila.dia,
    creadoEn: fila.createdAt.toISOString(),
  }));
}
