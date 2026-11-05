"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Cake, Check, Landmark, Loader2, Moon, Pencil, Sun, Sunrise } from "lucide-react";
import { guardarTelegramBot } from "@src/app/actions/telegram-config";
import {
  cargarTextoActualMensaje,
  editarMensajeTelegram,
} from "@src/app/actions/telegram-mensajes";
import {
  enviarCumpleanosTelegram,
  enviarEfemeridesTelegram,
  enviarServiciosTelegram,
} from "@src/app/actions/telegram-servicios";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { Textarea } from "@src/components/ui/textarea";
import type { MensajeTelegramLista } from "@src/lib/telegram/mensajes-tipos";
import { LIMITE_TEXTO_TELEGRAM } from "@src/lib/telegram/mensajes-tipos";
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
  mensajes: MensajeTelegramLista[];
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
  mensajes,
}: Props) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [chat, setChat] = useState(chatId);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [editando, setEditando] = useState<MensajeTelegramLista | null>(null);
  const [borrador, setBorrador] = useState("");
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

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
        router.refresh();
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
      if (result.ok) router.refresh();
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
      if (result.ok) router.refresh();
    });
  };

  const abrirEdicion = (mensaje: MensajeTelegramLista) => {
    setEditando(mensaje);
    setBorrador(mensaje.texto);
    setErrorEdicion(null);
  };

  const cargarActual = () => {
    if (!editando) return;
    setErrorEdicion(null);
    startTransition(async () => {
      const result = await cargarTextoActualMensaje(editando.id);
      if (result.ok) {
        setBorrador(result.texto);
        return;
      }
      setErrorEdicion(result.message);
    });
  };

  const guardarEdicion = () => {
    if (!editando) return;
    setErrorEdicion(null);
    startTransition(async () => {
      const result = await editarMensajeTelegram(editando.id, borrador);
      if (result.ok) {
        setEditando(null);
        setFeedback({ ok: true, text: "El mensaje del grupo quedó actualizado." });
        router.refresh();
        return;
      }
      setErrorEdicion(result.message);
    });
  };

  const fechaContenido = (mensaje: MensajeTelegramLista) =>
    `${String(mensaje.dia).padStart(2, "0")}/${String(mensaje.mes).padStart(2, "0")}/${mensaje.anio}`;

  const enviadoEn = (iso: string) =>
    new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

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

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Mensajes ya enviados</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Corrija un aviso en el mismo mensaje del grupo, sin publicar otro.
          </p>
        </div>
        {mensajes.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            Cuando envíe un aviso, quedará aquí para editarlo.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mensajes.map((mensaje) => (
              <li key={mensaje.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{mensaje.etiqueta}</p>
                  <p className="text-[11px] text-slate-500">
                    {fechaContenido(mensaje)} · enviado {enviadoEn(mensaje.creadoEn)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{vistaPrevia(mensaje.texto)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={!puedeEnviar || pending}
                  onClick={() => abrirEdicion(mensaje)}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={editando != null}
        onOpenChange={(open) => {
          if (!open && !pending) setEditando(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader className="pr-8">
            <DialogTitle>{editando ? editando.etiqueta : "Editar mensaje"}</DialogTitle>
            <DialogDescription>
              {editando
                ? `Reemplaza el mensaje del ${fechaContenido(editando)} en el grupo.`
                : "Reemplaza el mensaje en el grupo."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-5 py-4">
            <Textarea
              value={borrador}
              disabled={pending}
              onChange={(event) => setBorrador(event.target.value)}
              className="max-h-[min(50vh,24rem)] min-h-56 font-mono text-xs"
              aria-label="Texto del mensaje"
            />
            <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
              <span>Las etiquetas {"<b>"} e {"<i>"} se ven en negrita y cursiva.</span>
              <span className={cn("tabular-nums", borrador.length > LIMITE_TEXTO_TELEGRAM && "text-red-600")}>
                {borrador.length}/{LIMITE_TEXTO_TELEGRAM}
              </span>
            </div>
            {errorEdicion ? <p className="text-sm text-red-700">{errorEdicion}</p> : null}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" disabled={pending || !editando} onClick={cargarActual}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Cargar datos actuales
            </Button>
            <Button
              type="button"
              disabled={pending || !borrador.trim() || borrador.length > LIMITE_TEXTO_TELEGRAM}
              onClick={guardarEdicion}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Guardar en Telegram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function vistaPrevia(texto: string): string {
  const plano = texto
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!plano) return "Sin texto guardado. Ábralo y cargue los datos actuales.";
  return plano;
}
