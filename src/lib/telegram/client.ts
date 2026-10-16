export type TelegramSendResult = {
  messageId: number;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export function telegramConfig() {
  return {
    token: requireEnv("TELEGRAM_BOT_TOKEN"),
    chatId: requireEnv("TELEGRAM_CHAT_ID"),
  };
}

/** Envía un mensaje HTML al grupo configurado. */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const { token, chatId } = telegramConfig();
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
