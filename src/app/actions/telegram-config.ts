"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { routes } from "@src/lib/apps/routes";
import { verificarTelegramBot } from "@src/lib/telegram/client";
import {
  TELEGRAM_BOT_CONFIG_ID,
  loadTelegramBotStored,
} from "@src/lib/telegram/credenciales";

export type GuardarTelegramBotResult =
  | { ok: true; username: string; chat: string }
  | { ok: false; message: string };

export async function guardarTelegramBot(input: {
  token: string;
  chatId: string;
}): Promise<GuardarTelegramBotResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para configurar el bot." };
  }

  const chatId = input.chatId.trim();
  if (!chatId) return { ok: false, message: "Indica el chat o grupo." };

  const guardado = await loadTelegramBotStored();
  const token =
    input.token.trim() ||
    guardado?.botToken ||
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    "";
  if (!token) return { ok: false, message: "Indica el token del bot." };

  const verificado = await verificarTelegramBot(token, chatId);
  if (!verificado.ok) return verificado;

  await prisma.telegramBotConfig.upsert({
    where: { id: TELEGRAM_BOT_CONFIG_ID },
    create: { id: TELEGRAM_BOT_CONFIG_ID, botToken: token, chatId },
    update: { botToken: token, chatId },
  });

  await writeAuditLog({
    userId: session.user.id,
    userEmail: session.user.email,
    action: "TELEGRAM_BOT_CONFIGURAR",
    entityType: "TELEGRAM_BOT_CONFIG",
    entityId: TELEGRAM_BOT_CONFIG_ID,
    metadata: { chatId, username: verificado.username },
  });

  revalidatePath(routes.personal.telegram);
  return { ok: true, username: verificado.username, chat: verificado.chat };
}
