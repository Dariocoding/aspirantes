/**
 * Vista previa o envío manual de mensajes Telegram de roles.
 *
 *   npm run telegram:dry-run
 *   npx tsx scripts/telegram-dry-run.ts --send
 *   npx tsx scripts/telegram-dry-run.ts --modo=recordatorio-nocturno
 */
import { setDefaultResultOrder } from "node:dns";
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma";
import { ejecutarEnvioTelegram, type ModoEnvioTelegram } from "../src/lib/telegram/run-envio";

setDefaultResultOrder("ipv4first");
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const send = process.argv.includes("--send");
  const modoArg = process.argv.find((a) => a.startsWith("--modo="))?.split("=")[1];
  const modo: ModoEnvioTelegram =
    modoArg === "recordatorio-nocturno" ? "recordatorio-nocturno" : "servicios-manana";

  const prisma = new PrismaClient();
  try {
    const resultado = await ejecutarEnvioTelegram(prisma, modo, { dryRun: !send });
    if (resultado.dryRun) {
      console.log(
        `Modo: ${modo} (dry-run)\nFecha: ${resultado.fecha.dia}/${resultado.fecha.mes}/${resultado.fecha.anio}`,
      );
      console.log(`Diurnos: ${resultado.diurnos} · Nocturnos: ${resultado.nocturnos}\n`);
      console.log(resultado.texto.replace(/<[^>]+>/g, ""));
      console.log("\n--- HTML ---\n");
      console.log(resultado.texto);
      return;
    }

    console.log(
      `Enviado (${modo}) messageId=${resultado.messageId} fecha=${resultado.fecha.dia}/${resultado.fecha.mes}/${resultado.fecha.anio}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
