"use server";

import { auth } from "@src/auth";
import { writeAuditLog } from "@src/lib/audit/log";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { editTelegramMessage } from "@src/lib/telegram/client";
import { LIMITE_TEXTO_TELEGRAM } from "@src/lib/telegram/mensajes-tipos";
import { rearmarTextoMensaje } from "@src/lib/telegram/rearmar-mensaje";

type Resultado = { ok: true } | { ok: false; message: string };
type TextoResultado = { ok: true; texto: string } | { ok: false; message: string };

async function puedeOperar(): Promise<{ userId: string; email: string | null } | { message: string }> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    return { message: "Sin permiso para editar mensajes del grupo." };
  }
  return { userId: session.user.id, email: session.user.email ?? null };
}

export async function editarMensajeTelegram(id: string, texto: string): Promise<Resultado> {
  const acceso = await puedeOperar();
  if ("message" in acceso) return { ok: false, message: acceso.message };

  const limpio = texto.replace(/\r\n/g, "\n");
  if (!limpio.trim()) return { ok: false, message: "El mensaje no puede quedar vacío." };
  if (limpio.length > LIMITE_TEXTO_TELEGRAM) {
    return {
      ok: false,
      message: `El texto tiene ${limpio.length} caracteres. Telegram admite hasta ${LIMITE_TEXTO_TELEGRAM}.`,
    };
  }

  const mensaje = await prisma.telegramMensaje.findUnique({ where: { id } });
  if (!mensaje) return { ok: false, message: "No se encontró ese mensaje." };

  try {
    await editTelegramMessage(mensaje.messageId, limpio);
    await prisma.telegramMensaje.update({
      where: { id: mensaje.id },
      data: { texto: limpio },
    });
    await writeAuditLog({
      userId: acceso.userId,
      userEmail: acceso.email,
      action: "TELEGRAM_MENSAJE_EDITAR",
      entityType: "TELEGRAM_MENSAJE",
      entityId: mensaje.id,
      metadata: { messageId: mensaje.messageId, tipo: mensaje.tipo },
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo editar el mensaje en Telegram.";
    console.error("[telegram-editar]", error);
    return { ok: false, message };
  }
}

/** Rellena el editor con el texto que saldría hoy, sin publicarlo. */
export async function cargarTextoActualMensaje(id: string): Promise<TextoResultado> {
  const acceso = await puedeOperar();
  if ("message" in acceso) return { ok: false, message: acceso.message };

  const mensaje = await prisma.telegramMensaje.findUnique({ where: { id } });
  if (!mensaje) return { ok: false, message: "No se encontró ese mensaje." };

  try {
    const texto = await rearmarTextoMensaje(prisma, mensaje);
    if (!texto?.trim()) {
      return { ok: false, message: "No hay datos actuales para armar ese aviso." };
    }
    if (texto.length > LIMITE_TEXTO_TELEGRAM) {
      return {
        ok: false,
        message: `El texto armado tiene ${texto.length} caracteres y no cabe en Telegram.`,
      };
    }
    return { ok: true, texto };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo armar el texto.";
    console.error("[telegram-rearmar]", error);
    return { ok: false, message };
  }
}
