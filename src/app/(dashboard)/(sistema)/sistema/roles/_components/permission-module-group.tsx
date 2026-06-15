"use client";

import { Check, ChevronDown, Minus } from "lucide-react";
import { useState } from "react";
import type { ModuleRow } from "@dashboard/sistema/roles/_components/types";
import { Button } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";

type Props = {
  module: ModuleRow;
  checkedPerms: Set<string>;
  canManageRoles: boolean;
  onTogglePerm: (id: string) => void;
  onSetModulePerms: (ids: string[], enabled: boolean) => void;
};

export function PermissionModuleGroup({
  module,
  checkedPerms,
  canManageRoles,
  onTogglePerm,
  onSetModulePerms,
}: Props) {
  const [open, setOpen] = useState(false);
  const ids = module.permissions.map((p) => p.id);
  const enabledCount = ids.filter((id) => checkedPerms.has(id)).length;
  const allOn = ids.length > 0 && enabledCount === ids.length;
  const someOn = enabledCount > 0 && !allOn;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left transition-colors hover:bg-slate-100/60"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900">{module.label}</span>
            <span className="block font-mono text-[10px] text-slate-500">{module.key}</span>
          </span>
        </button>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-slate-600">
          {enabledCount}/{ids.length}
        </span>
        {canManageRoles && ids.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-slate-600"
            onClick={() => onSetModulePerms(ids, !allOn)}
          >
            {allOn ? "Quitar todo" : "Marcar todo"}
          </Button>
        ) : null}
      </div>

      {open ? (
        <ul className="divide-y divide-slate-100 p-1.5">
          {module.permissions.map((perm) => {
            const on = checkedPerms.has(perm.id);
            return (
              <li key={perm.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 transition-colors",
                    on ? "bg-primary/5" : "hover:bg-slate-50",
                    !canManageRoles && "cursor-default",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onTogglePerm(perm.id)}
                    disabled={!canManageRoles}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : someOn
                          ? "border-slate-300 bg-white"
                          : "border-slate-200 bg-white",
                    )}
                    aria-hidden
                  >
                    {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">{perm.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] leading-snug text-slate-500">{perm.key}</span>
                    {perm.description ? (
                      <span className="mt-1 block text-[11px] text-slate-500">{perm.description}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
          {module.permissions.length === 0 ? (
            <li className="flex items-center gap-2 px-3 py-4 text-xs text-slate-500">
              <Minus className="h-3.5 w-3.5" aria-hidden />
              Sin permisos en este módulo.
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}
