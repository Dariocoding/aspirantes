"use client";

import { useState, useTransition } from "react";
import { Cake, Check, ChevronDown, Landmark, Loader2, Moon, Send, Sun, Sunrise } from "lucide-react";
import {
  enviarCumpleanosTelegram,
  enviarEfemeridesTelegram,
  enviarServiciosTelegram,
} from "@src/app/actions/telegram-servicios";
import type { ModoEnvioManual } from "@src/lib/telegram/run-envio";
import { buttonVariants } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { cn } from "@src/lib/utils";

const OPCIONES: {
  modo: ModoEnvioManual;
  label: string;
  detalle: string;
  icon: typeof Sun;
}[] = [
  {
    modo: "hoy",
    label: "Servicio de hoy",
    detalle: "Diurnos de hoy (Caracas)",
    icon: Sun,
  },
  {
    modo: "esta-noche",
    label: "Servicio de esta noche",
    detalle: "Nocturnos / estacionamiento de esta noche",
    icon: Moon,
  },
  {
    modo: "manana",
    label: "Servicio de mañana",
    detalle: "Diurnos de mañana",
    icon: Sunrise,
  },
];

type Props = {
  className?: string;
};

export function TelegramEnviarButton({ className }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const enviarServicio = (modo: ModoEnvioManual) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarServiciosTelegram(modo);
      if (result.ok) {
        const fecha = `${String(result.fecha.dia).padStart(2, "0")}/${String(result.fecha.mes).padStart(2, "0")}`;
        setFeedback({ ok: true, text: `Enviado al grupo (${fecha})` });
      } else {
        setFeedback({ ok: false, text: result.message });
      }
    });
  };

  const enviarCumples = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarCumpleanosTelegram();
      if (!result.ok) {
        setFeedback({ ok: false, text: result.message });
        return;
      }
      if (result.totalPersonas === 0) {
        setFeedback({ ok: true, text: "Nadie cumple hoy, mañana ni en 2 días" });
        return;
      }
      setFeedback({
        ok: true,
        text: `Cumpleaños enviado (${result.totalPersonas} persona${result.totalPersonas === 1 ? "" : "s"})`,
      });
    });
  };

  const enviarEfemerides = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enviarEfemeridesTelegram();
      if (!result.ok) {
        setFeedback({ ok: false, text: result.message });
        return;
      }
      if (result.totalItems === 0) {
        setFeedback({ ok: true, text: "No hay efemérides hoy ni mañana" });
        return;
      }
      setFeedback({
        ok: true,
        text: `Efemérides enviadas (${result.totalItems})`,
      });
    });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className={cn(
            buttonVariants({ variant: "secondary", size: "xs" }),
            "gap-1.5",
          )}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Send className="size-3.5" aria-hidden />
          )}
          Telegram
          <ChevronDown className="size-3 opacity-70" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-64">
          {OPCIONES.map((op) => {
            const Icon = op.icon;
            return (
              <DropdownMenuItem
                key={op.modo}
                disabled={pending}
                onClick={() => enviarServicio(op.modo)}
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{op.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{op.detalle}</span>
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={pending} onClick={enviarCumples}>
            <Cake className="size-3.5" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Cumpleaños</span>
              <span className="block text-[11px] text-muted-foreground">
                Hoy (felicitaciones), mañana y en 2 días
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={enviarEfemerides}>
            <Landmark className="size-3.5" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">Efemérides</span>
              <span className="block text-[11px] text-muted-foreground">
                Hoy y mañana (activas en el calendario)
              </span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {feedback ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px]",
            feedback.ok ? "text-teal-700" : "text-red-600",
          )}
          role="status"
        >
          {feedback.ok ? <Check className="size-3" aria-hidden /> : null}
          {feedback.text}
        </span>
      ) : null}
    </div>
  );
}
