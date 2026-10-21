import { resolveTelegramCredentials } from "@src/lib/telegram/credenciales";

export type TelegramSendResult = {
  messageId: number;
};

async function leerTelegram(response: Response): Promise<{
  ok?: boolean;
  description?: string;
  result?: { message_id?: number; username?: string; title?: string };
}> {
  return (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number; username?: string; title?: string };
  };
}

/** Comprueba el token con getMe y que el chat exista. */
export async function verificarTelegramBot(
  token: string,
  chatId: string,
): Promise<{ ok: true; username: string; chat: string } | { ok: false; message: string }> {
  const limpio = token.trim();
  const chat = chatId.trim();
  if (!limpio || !chat) return { ok: false, message: "Faltan el token del bot o el chat." };

  const me = await fetch(`https://api.telegram.org/bot${limpio}/getMe`);
  const mePayload = await leerTelegram(me);
  if (!me.ok || !mePayload.ok || !mePayload.result?.username) {
    return { ok: false, message: mePayload.description ?? "El token del bot no es válido." };
  }

  const destino = await fetch(
    `https://api.telegram.org/bot${limpio}/getChat?chat_id=${encodeURIComponent(chat)}`,
  );
  const destinoPayload = await leerTelegram(destino);
  if (!destino.ok || !destinoPayload.ok) {
    return { ok: false, message: destinoPayload.description ?? "No se pudo abrir ese chat." };
  }

  return {
    ok: true,
    username: mePayload.result.username,
    chat: destinoPayload.result?.title ?? chat,
  };
}

/** Envía un mensaje HTML al grupo configurado. */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const credenciales = await resolveTelegramCredentials();
  if (!credenciales) {
    throw new Error("Telegram no está configurado.");
  }
  const { token, chatId } = credenciales;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram HTTP ${response.status}`);
  }

  const messageId = payload.result?.message_id;
  if (messageId == null) {
    throw new Error("Telegram no devolvió message_id");
  }

  return { messageId };
}
