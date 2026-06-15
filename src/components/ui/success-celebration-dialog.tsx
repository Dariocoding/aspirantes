"use client";

import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { cn } from "@src/lib/utils";
import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";

export type SuccessCelebrationVariant = "saved" | "created" | "deleted";

const defaultCopy: Record<
  SuccessCelebrationVariant,
  { title: string; description: string }
> = {
  saved: {
    title: "Guardado con éxito",
    description: "Los cambios quedaron registrados correctamente.",
  },
  created: {
    title: "Registro completado",
    description: "La información se almacenó correctamente en el sistema.",
  },
  deleted: {
    title: "Eliminado con éxito",
    description: "La operación se completó. Ya puede continuar.",
  },
};

type SuccessCelebrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: SuccessCelebrationVariant;
  title?: string;
  description?: string;
};

/** Partículas radiales (solo CSS) para el estallido al completar. */
function ConfettiBurst({ active }: { active: boolean }) {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  if (!active) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden
    >
      {angles.map((deg) => (
        <span
          key={deg}
          className="celebrate-particle absolute h-2 w-2 rounded-[2px] bg-emerald-400/90 shadow-sm shadow-emerald-600/30"
          style={{ "--celebrate-rot": `${deg}deg` } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function SuccessCelebrationDialog({
  open,
  onOpenChange,
  variant,
  title: titleProp,
  description: descriptionProp,
}: SuccessCelebrationDialogProps) {
  const defaults = defaultCopy[variant];
  const title = titleProp ?? defaults.title;
  const description = descriptionProp ?? defaults.description;
  const titleId = useId();
  const [burstKey, setBurstKey] = useState(0);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setBurstKey((k) => k + 1);
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="z-[100] max-w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/90 p-0 shadow-emerald-900/15 sm:max-w-md dark:border-emerald-900/40 dark:from-emerald-950/95 dark:to-slate-950 dark:shadow-black/40"
        aria-labelledby={titleId}
      >
        <div className="relative px-6 pt-10 pb-2">
          <div className="celebrate-ripple-host pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+0.5rem)]">
            <span className="celebrate-ripple absolute inline-flex h-28 w-28 rounded-full border-2 border-emerald-400/50" />
            <span className="celebrate-ripple celebrate-ripple-delay absolute inline-flex h-28 w-28 rounded-full border-2 border-teal-300/40" />
          </div>

          <div className="relative mx-auto flex h-[5.5rem] w-[5.5rem] items-center justify-center">
            <ConfettiBurst active={open} key={burstKey} />
            <div
              key={burstKey}
              className="celebrate-icon-shell relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-600/35 ring-4 ring-emerald-100/90 dark:ring-emerald-950/80"
            >
              <span className="celebrate-shine pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <span className="celebrate-shine-bar absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent dark:via-white/20" />
              </span>
              <svg
                className="relative z-[1] h-[2.35rem] w-[2.35rem] text-white drop-shadow-sm"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path className="celebrate-check-path" d="M5 13l5 5L20 7" />
              </svg>
            </div>
          </div>
        </div>

        <DialogHeader className="border-0 px-6 pb-1 pt-2 text-center sm:text-center">
          <DialogTitle
            id={titleId}
            className="text-center text-lg font-semibold tracking-tight text-emerald-950 dark:text-emerald-50"
          >
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed text-emerald-900/75 dark:text-emerald-100/70">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-0 px-6 pb-6 pt-4">
          <Button
            type="button"
            className={cn(
              "w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 font-medium text-white shadow-md shadow-emerald-700/25 hover:from-emerald-500 hover:to-teal-500 sm:w-full",
            )}
            onClick={() => onOpenChange(false)}
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
