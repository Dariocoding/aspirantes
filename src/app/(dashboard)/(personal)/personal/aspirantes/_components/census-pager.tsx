"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCensusNavigate } from "@dashboard/aspirantes/_components/census-selection";
import { buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

export function CensusPager({
  page,
  totalPages,
  prevHref,
  nextHref,
}: {
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const { go, pending } = useCensusNavigate();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-slate-200/90 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        pending && "opacity-70",
      )}
      aria-busy={pending}
    >
      <p className="text-xs text-slate-500">
        Página <span className="font-semibold tabular-nums text-slate-800">{page}</span> de{" "}
        <span className="font-semibold tabular-nums text-slate-800">{totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PagerButton href={prevHref} pending={pending} onGo={go} direction="prev" />
        <PagerButton href={nextHref} pending={pending} onGo={go} direction="next" />
      </div>
    </div>
  );
}

function PagerButton({
  href,
  pending,
  onGo,
  direction,
}: {
  href: string | null;
  pending: boolean;
  onGo: (href: string) => void;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Anterior" : "Siguiente";
  const icon =
    direction === "prev" ? (
      <ChevronLeft className="h-4 w-4" aria-hidden />
    ) : (
      <ChevronRight className="h-4 w-4" aria-hidden />
    );

  if (!href) {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none h-9 gap-1 border-slate-100 bg-slate-100/50 text-slate-400 opacity-60",
          direction === "prev" ? "pr-3 pl-2.5" : "pr-2.5 pl-3",
        )}
      >
        {direction === "prev" ? icon : null}
        {label}
        {direction === "next" ? icon : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onGo(href)}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-9 gap-1 border-slate-200 bg-white shadow-sm",
        direction === "prev" ? "pr-3 pl-2.5" : "pr-2.5 pl-3",
      )}
    >
      {direction === "prev" ? icon : null}
      {label}
      {direction === "next" ? icon : null}
    </button>
  );
}
