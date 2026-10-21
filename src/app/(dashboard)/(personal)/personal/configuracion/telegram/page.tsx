import Link from "next/link";
import { unauthorized } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@src/auth";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { enmascararToken, loadTelegramBotStored } from "@src/lib/telegram/credenciales";
import { TelegramConfigPanel } from "./_components/telegram-config-panel";

export default async function TelegramConfigPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();

  const canWrite = hasPermission(ctx, Permission.ASPIRANTES_WRITE);
  const stored = await loadTelegramBotStored();
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const envChat = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
  const tokenGuardado = stored?.botToken ?? "";
  const chatGuardado = stored?.chatId ?? "";
  const tokenActivo = tokenGuardado || envToken;
  const chatActivo = chatGuardado || envChat;

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-4">
      <header className="space-y-2">
        <Link
          href={routes.personal.configuracion}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Configuración
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Telegram</h1>
          <p className="text-xs text-slate-500">
            Bot del grupo y envío manual de servicios, cumpleaños y efemérides.
          </p>
        </div>
      </header>

      <TelegramConfigPanel
        canWrite={canWrite}
        puedeEnviar={Boolean(tokenActivo && chatActivo)}
        tokenMascara={tokenGuardado ? enmascararToken(tokenGuardado) : envToken ? "Definido en el servidor" : ""}
        tokenEnConfiguracion={Boolean(tokenGuardado)}
        chatId={chatActivo}
        chatEnConfiguracion={Boolean(chatGuardado)}
      />
    </div>
  );
}
