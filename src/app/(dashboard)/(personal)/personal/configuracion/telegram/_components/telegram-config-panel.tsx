"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cake, Check, Landmark, Loader2, Moon, Sun, Sunrise } from "lucide-react";
import { guardarTelegramBot } from "@src/app/actions/telegram-config";
import {
  enviarCumpleanosTelegram,
  enviarEfemeridesTelegram,
  enviarServiciosTelegram,
} from "@src/app/actions/telegram-servicios";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import type { ModoEnvioManual } from "@src/lib/telegram/run-envio";
import { cn } from "@src/lib/utils";

type Feedback = { ok: boolean; text: string };

type Props = {
  canWrite: boolean;
  puedeEnviar: boolean;
  tokenMascara: string;
  tokenEnConfiguracion: boolean;
  chatId: string;
  chatEnConfiguracion: boolean;
};

const ENVIOS: { modo: ModoEnvioManual; label: string; detalle: string; icon: typeof Sun }[] = [
  { modo: "hoy", label: "Servicio de hoy", detalle: "Diurnos de hoy (Caracas)", icon: Sun },
  {
    modo: "esta-noche",
    label: "Servicio de esta noche",
    detalle: "Nocturnos y estacionamiento de esta noche",
    icon: Moon,
  },
  { modo: "manana", label: "Servicio de mañana", detalle: "Diurnos de mañana", icon: Sunrise },
];

export function TelegramConfigPanel({
  canWrite,
  puedeEnviar,
  tokenMascara,
  tokenEnConfiguracion,
  chatId,
  chatEnConfiguracion,
}: Props) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [chat, setChat] = useState(chatId);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const guardar = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await guardarTelegramBot({ token, chatId: chat });
      if (result.ok) {
        setToken("");
        setFeedback({
          ok: true,
          text: `Bot @${result.username} listo para ${result.chat}.`,
        });
        router.refresh();
        return;
      }
      setFeedback({ ok: false, text: result.message });
    });
  };

  const enviar = (modo: ModoEnvioManual) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarServiciosTelegram(modo);
      if (result.ok) {
        const fecha = `${String(result.fecha.dia).padStart(2, "0")}/${String(result.fecha.mes).padStart(2, "0")}`;
        setFeedback({
          ok: true,
          text: `Enviado (${fecha}): ${result.diurnos} diurnos, ${result.nocturnos} nocturnos.`,
        });
        return;
      }
      setFeedback({ ok: false, text: result.message });
    });
  };

  const enviarCumples = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarCumpleanosTelegram();
      setFeedback(
        result.ok
          ? { ok: true, text: `Cumpleaños enviados (${result.totalPersonas}).` }
          : { ok: false, text: result.message },
      );
    });
  };

  const enviarEfemerides = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarEfemeridesTelegram();
      setFeedback(
        result.ok
          ? { ok: true, text: `Efemérides enviadas (${result.totalItems}).` }
          : { ok: false, text: result.message },
      );
    });
  };

  return (
    <div className="space-y-4">
      {feedback ? (
        <p
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
            feedback.ok
              ? "border-teal-200 bg-teal-50 text-teal-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
          role="status"
        >
          {feedback.ok ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
          <span>{feedback.text}</span>
        </p>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Bot</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {tokenMascara
              ? tokenEnConfiguracion
                ? `Token guardado (${tokenMascara}). Déjelo vacío para conservarlo.`
                : "El token actual viene del servidor. Péguelo aquí para guardarlo en configuración."
              : "Pegue el token que entrega BotFather y el id del grupo."}
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Token del bot
            <Input
              type="password"
              autoComplete="off"
              value={token}
              disabled={!canWrite || pending}
              placeholder={tokenMascara || "123456:ABC…"}
              onChange={(event) => setToken(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-600">
            Chat o grupo
            <Input
              value={chat}
              disabled={!canWrite || pending}
              placeholder="-100…"
              onChange={(event) => setChat(event.target.value)}
            />
            {chatId && !chatEnConfiguracion ? (
              <span className="font-normal text-slate-400">Tomado del servidor. Guárdelo para fijarlo aquí.</span>
            ) : null}
          </label>
          <div className="sm:col-span-2">
            <Button type="button" disabled={!canWrite || pending} onClick={guardar}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Guardar bot
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Enviar al grupo</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {puedeEnviar
              ? "Los mismos avisos que salían del cuadro de servicio."
              : "Configure el bot para poder enviar."}
          </p>
        </div>
        <ul className="grid list-none gap-2 p-4 sm:grid-cols-2">
          {ENVIOS.map((op) => {
            const Icon = op.icon;
            return (
              <li key={op.modo}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-start gap-2 px-3 py-2"
                  disabled={!puedeEnviar || pending}
                  onClick={() => enviar(op.modo)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-medium">{op.label}</span>
                    <span className="block text-[11px] font-normal text-slate-500">{op.detalle}</span>
                  </span>
                </Button>
              </li>
            );
          })}
          <li>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-start gap-2 px-3 py-2"
              disabled={!puedeEnviar || pending}
              onClick={enviarCumples}
            >
              <Cake className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 text-left">
                <span className="block text-sm font-medium">Cumpleaños</span>
                <span className="block text-[11px] font-normal text-slate-500">
                  Hoy, mañana y en 2 días
                </span>
              </span>
            </Button>
          </li>
          <li>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-start gap-2 px-3 py-2"
              disabled={!puedeEnviar || pending}
              onClick={enviarEfemerides}
            >
              <Landmark className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 text-left">
                <span className="block text-sm font-medium">Efemérides</span>
                <span className="block text-[11px] font-normal text-slate-500">
                  Hoy y mañana, si están activas
                </span>
              </span>
            </Button>
          </li>
        </ul>
      </section>
    </div>
  );
}
