import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Secreto que Telegram debe mandar en `X-Telegram-Bot-Api-Secret-Token`. */
export function secretoWebhookTelegram(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || process.env.CRON_SECRET?.trim() || null;
}

export function autorizarWebhookTelegram(request: Request): boolean {
  const secreto = secretoWebhookTelegram();
  if (!secreto) return true;

  const header = request.headers.get("x-telegram-bot-api-secret-token")?.trim() ?? "";
  return Boolean(header) && safeEqual(header, secreto);
}
