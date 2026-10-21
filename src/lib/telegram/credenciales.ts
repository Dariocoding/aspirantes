import { prisma } from "@src/lib/prisma";

export const TELEGRAM_BOT_CONFIG_ID = "telegram_bot";

export type TelegramCredenciales = {
  token: string;
  chatId: string;
  /** El token guardado en configuración tiene prioridad sobre el entorno. */
  tokenEnBase: boolean;
  chatEnBase: boolean;
};

export async function loadTelegramBotStored(): Promise<{ botToken: string; chatId: string } | null> {
  const row = await prisma.telegramBotConfig.findUnique({
    where: { id: TELEGRAM_BOT_CONFIG_ID },
  });
  if (!row) return null;
  return { botToken: row.botToken.trim(), chatId: row.chatId.trim() };
}

/** Token y chat: primero lo guardado en configuración, si falta usa el entorno. */
export async function resolveTelegramCredentials(): Promise<TelegramCredenciales | null> {
  const stored = await loadTelegramBotStored();
  const token = stored?.botToken || process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const chatId = stored?.chatId || process.env.TELEGRAM_CHAT_ID?.trim() || "";
  if (!token || !chatId) return null;
  return {
    token,
    chatId,
    tokenEnBase: Boolean(stored?.botToken),
    chatEnBase: Boolean(stored?.chatId),
  };
}

export function enmascararToken(token: string): string {
  const limpio = token.trim();
  if (limpio.length <= 4) return "Configurado";
  return `••••${limpio.slice(-4)}`;
}
