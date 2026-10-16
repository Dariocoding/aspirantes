import { NextResponse } from "next/server";
import { prisma } from "@src/lib/prisma";
import { autorizarCron } from "@src/lib/telegram/cron-auth";
import {
  ejecutarEnvioTelegram,
  type ModoEnvioTelegram,
} from "@src/lib/telegram/run-envio";

export async function handleCronTelegram(request: Request, modo: ModoEnvioTelegram) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, message: "CRON_SECRET no configurado" },
      { status: 503 },
    );
  }

  if (!autorizarCron(request)) {
    return NextResponse.json({ ok: false, message: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  try {
    const resultado = await ejecutarEnvioTelegram(prisma, modo, { dryRun });
    return NextResponse.json({
      ...resultado,
      enviados: dryRun ? 0 : 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al enviar";
    console.error(`[cron/telegram/${modo}]`, error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
