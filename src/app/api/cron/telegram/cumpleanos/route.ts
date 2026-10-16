import { NextResponse } from "next/server";
import { prisma } from "@src/lib/prisma";
import { autorizarCron } from "@src/lib/telegram/cron-auth";
import { ejecutarEnvioCumpleanos } from "@src/lib/telegram/run-cumpleanos";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(request: Request) {
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
    const resultado = await ejecutarEnvioCumpleanos(prisma, { dryRun });
    return NextResponse.json(resultado);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al enviar cumpleaños";
    console.error("[cron/telegram/cumpleanos]", error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
