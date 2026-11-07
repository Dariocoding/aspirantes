/**
 * Registra el webhook para que el bot responda cédulas en el chat privado.
 *
 *   npx tsx scripts/telegram-set-webhook.ts https://tu-dominio/api/telegram/webhook
 */
import { setDefaultResultOrder } from "node:dns";
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma";

setDefaultResultOrder("ipv4first");
dotenv.config({ path: ".env.local" });
dotenv.config();

async function tokenDelBot(): Promise<string> {
  const desdeEntorno = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (desdeEntorno) return desdeEntorno;

  const prisma = new PrismaClient();
  try {
    const row = await prisma.telegramBotConfig.findUnique({ where: { id: "telegram_bot" } });
    const token = row?.botToken.trim() ?? "";
    if (!token) throw new Error("No hay token del bot ni en el entorno ni en la base.");
    return token;
  } finally {
    await prisma.$disconnect();
  }
}

async function llamar(token: string, metodo: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { ok?: boolean; description?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram HTTP ${response.status}`);
  }
}

async function main() {
  const url = process.argv[2]?.trim();
  if (!url || !url.startsWith("https://")) {
    console.error("Uso: npx tsx scripts/telegram-set-webhook.ts https://tu-dominio/api/telegram/webhook");
    process.exit(1);
  }

  const token = await tokenDelBot();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";
  await llamar(token, "setWebhook", {
    url,
    secret_token: secret || undefined,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  await llamar(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Cómo consultar los roles del mes" },
      { command: "roles", description: "Pedir los roles con la cédula" },
    ],
  });

  console.log(`Webhook registrado: ${url}`);
  console.log(secret ? "Telegram enviará el secreto del cron o TELEGRAM_WEBHOOK_SECRET." : "Sin secreto. Conviene definir CRON_SECRET.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
