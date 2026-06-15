"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@src/lib/utils";

type Props = {
  metadata: unknown;
};

export function AuditMetadataToggle({ metadata }: Props) {
  const [open, setOpen] = useState(false);
  const serialized = JSON.stringify(metadata, null, 2);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
        {open ? "Ocultar detalle" : "Ver detalle"}
      </button>
      {open ? (
        <pre className="mt-1.5 max-h-32 overflow-auto rounded-lg border border-slate-200/90 bg-slate-950 px-3 py-2 font-mono text-[10px] leading-relaxed text-emerald-100/90">
          {serialized}
        </pre>
      ) : null}
    </div>
  );
}
