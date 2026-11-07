import { enviarTelegramAChat } from "@src/lib/telegram/client";
import { textoRespuestaCedula } from "@src/lib/telegram/load-roles-cedula";
import { prisma } from "@src/lib/prisma";
import { autorizarWebhookTelegram } from "@src/lib/telegram/webhook-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramChat = { id?: number | string; type?: string };
type TelegramMessage = {
  text?: string;
  chat?: TelegramChat;
  from?: { is_bot?: boolean };
};

/** Telegram avisa cada mensaje privado. Responde la cédula con los roles del mes. */
export async function POST(request: Request) {
  if (!autorizarWebhookTelegram(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let message: TelegramMessage | undefined;
  try {
    const update = (await request.json()) as { message?: TelegramMessage };
    message = update.message;
  } catch {
    return Response.json({ ok: true });
  }

  const chatId = message?.chat?.id;
  const texto = message?.text?.trim();
  if (chatId == null || !texto || message?.chat?.type !== "private" || message.from?.is_bot) {
    return Response.json({ ok: true });
  }

  try {
    const respuesta = await textoRespuestaCedula(prisma, texto);
    await enviarTelegramAChat(chatId, respuesta);
  } catch (error) {
    console.error("telegram webhook:", error instanceof Error ? error.message : "error");
  }

  return Response.json({ ok: true });
}
