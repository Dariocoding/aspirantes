import { resolveTelegramCredentials, resolveTelegramToken } from "@src/lib/telegram/credenciales";

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

/** Responde en el chat que escribió (privado), no en el grupo configurado. */
export async function enviarTelegramAChat(chatId: string | number, text: string): Promise<void> {
  const token = await resolveTelegramToken();
  if (!token) {
    throw new Error("Telegram no está configurado.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
  });

  const payload = await leerTelegram(response);
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram HTTP ${response.status}`);
  }
}

/** Reemplaza el texto de un mensaje que este bot ya publicó en el grupo. */
export async function editTelegramMessage(messageId: number, text: string): Promise<void> {
  const credenciales = await resolveTelegramCredentials();
  if (!credenciales) {
    throw new Error("Telegram no está configurado.");
  }
  const { token, chatId } = credenciales;
  const response = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
  });

  const payload = await leerTelegram(response);
  if (response.ok && payload.ok) return;

  const descripcion = payload.description ?? `Telegram HTTP ${response.status}`;
  if (/message is not modified/i.test(descripcion)) return;
  throw new Error(traducirErrorEdicion(descripcion));
}

function traducirErrorEdicion(descripcion: string): string {
  if (/message to edit not found|message identifier is not specified/i.test(descripcion)) {
    return "Ese mensaje ya no está en el grupo.";
  }
  if (/message can't be edited/i.test(descripcion)) {
    return "Telegram ya no permite editar ese mensaje.";
  }
  if (/can't parse entities|parse entities/i.test(descripcion)) {
    return "El formato no es válido. Revise las etiquetas <b> e <i>.";
  }
  if (/message is too long|MESSAGE_TOO_LONG/i.test(descripcion)) {
    return "El texto supera el límite de Telegram (4096 caracteres).";
  }
  return descripcion;
}
