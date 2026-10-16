"use server";

import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { ejecutarEnvioCumpleanos } from "@src/lib/telegram/run-cumpleanos";
import { ejecutarEnvioEfemerides } from "@src/lib/telegram/run-efemerides";
import {
  ejecutarEnvioTelegram,
  type ModoEnvioManual,
} from "@src/lib/telegram/run-envio";

export type EnviarTelegramResult =
  | {
      ok: true;
      messageId: number;
      fecha: { anio: number; mes: number; dia: number };
      diurnos: number;
      nocturnos: number;
    }
  | { ok: false; message: string };

export type EnviarCumpleanosResult =
  | {
      ok: true;
      messageId: number | null;
      fecha: { anio: number; mes: number; dia: number };
      totalPersonas: number;
      enviados: number;
    }
  | { ok: false; message: string };

export type EnviarEfemeridesResult =
  | {
      ok: true;
      messageId: number | null;
      fecha: { anio: number; mes: number; dia: number };
      totalItems: number;
      enviados: number;
    }
  | { ok: false; message: string };

const MODOS: ModoEnvioManual[] = ["hoy", "esta-noche", "manana"];

function telegramConfigurado(): string | null {
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim() || !process.env.TELEGRAM_CHAT_ID?.trim()) {
    return "Telegram no está configurado (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).";
  }
  return null;
}

export async function enviarServiciosTelegram(
  modo: ModoEnvioManual,
): Promise<EnviarTelegramResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return { ok: false, message: "Sin permiso para enviar al grupo." };
  }

  if (!MODOS.includes(modo)) {
    return { ok: false, message: "Modo de envío inválido." };
  }

  const configError = telegramConfigurado();
  if (configError) return { ok: false, message: configError };

  try {
    const resultado = await ejecutarEnvioTelegram(prisma, modo);
    if (resultado.dryRun) {
      return { ok: false, message: "Envío incompleto." };
    }

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "TELEGRAM_SERVICIOS_ENVIAR",
      entityType: "PLAN_ROL_SERVICIO",
      entityId: `${resultado.fecha.anio}-${String(resultado.fecha.mes).padStart(2, "0")}-${String(resultado.fecha.dia).padStart(2, "0")}`,
      metadata: {
        modo,
        messageId: resultado.messageId,
        diurnos: resultado.diurnos,
        nocturnos: resultado.nocturnos,
      },
    });

    return {
      ok: true,
      messageId: resultado.messageId,
      fecha: resultado.fecha,
      diurnos: resultado.diurnos,
      nocturnos: resultado.nocturnos,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar a Telegram.";
    console.error("[telegram-servicios]", error);
    return { ok: false, message };
  }
}

/** Avisos: hoy (felicitaciones), mañana y en 2 días. */
export async function enviarCumpleanosTelegram(): Promise<EnviarCumpleanosResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return { ok: false, message: "Sin permiso para enviar al grupo." };
  }

  const configError = telegramConfigurado();
  if (configError) return { ok: false, message: configError };

  try {
    const resultado = await ejecutarEnvioCumpleanos(prisma);
    if (resultado.totalPersonas === 0) {
      return {
        ok: true,
        messageId: null,
        fecha: resultado.fecha,
        totalPersonas: 0,
        enviados: 0,
      };
    }

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "TELEGRAM_CUMPLEANOS_ENVIAR",
      entityType: "ASPIRANTE",
      entityId: `${resultado.fecha.anio}-${String(resultado.fecha.mes).padStart(2, "0")}-${String(resultado.fecha.dia).padStart(2, "0")}`,
      metadata: {
        messageId: resultado.messageId,
        totalPersonas: resultado.totalPersonas,
        avisos: resultado.avisos,
      },
    });

    return {
      ok: true,
      messageId: resultado.messageId,
      fecha: resultado.fecha,
      totalPersonas: resultado.totalPersonas,
      enviados: resultado.enviados,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar a Telegram.";
    console.error("[telegram-cumpleanos]", error);
    return { ok: false, message };
  }
}

/** Efemérides activas de hoy y mañana (dato vivo de la BD). */
export async function enviarEfemeridesTelegram(): Promise<EnviarEfemeridesResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return { ok: false, message: "Sin permiso para enviar al grupo." };
  }

  const configError = telegramConfigurado();
  if (configError) return { ok: false, message: configError };

  try {
    const resultado = await ejecutarEnvioEfemerides(prisma);
    if (resultado.totalItems === 0) {
      return {
        ok: true,
        messageId: null,
        fecha: resultado.fecha,
        totalItems: 0,
        enviados: 0,
      };
    }

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "TELEGRAM_EFEMERIDES_ENVIAR",
      entityType: "EFEMERIDE",
      entityId: `${resultado.fecha.anio}-${String(resultado.fecha.mes).padStart(2, "0")}-${String(resultado.fecha.dia).padStart(2, "0")}`,
      metadata: {
        messageId: resultado.messageId,
        totalItems: resultado.totalItems,
        avisos: resultado.avisos,
      },
    });

    return {
      ok: true,
      messageId: resultado.messageId,
      fecha: resultado.fecha,
      totalItems: resultado.totalItems,
      enviados: resultado.enviados,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar a Telegram.";
    console.error("[telegram-efemerides]", error);
    return { ok: false, message };
  }
}
