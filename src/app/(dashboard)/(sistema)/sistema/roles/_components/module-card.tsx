"use client";

import { Box, Trash2 } from "lucide-react";
import { createAuthPermission, deleteAuthModule } from "@src/app/actions/rbac";
import type { ModuleRow } from "@dashboard/sistema/roles/_components/types";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";

type Props = {
  mod: ModuleRow;
  canManageModules: boolean;
  onRefresh: () => void;
};

export function ModuleCard({ mod, canManageModules, onRefresh }: Props) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm transition-shadow hover:shadow-md hover:shadow-slate-900/5">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Box className="h-3.5 w-3.5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-900">{mod.label}</h4>
            <p className="font-mono text-[10px] text-slate-500">{mod.key}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {mod.permissions.length} perm.
        </Badge>
        {canManageModules && mod.permissions.length === 0 ? (
          <form
            action={async () => {
              await deleteAuthModule(mod.id);
              onRefresh();
            }}
          >
            <Button
              type="submit"
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              aria-label={`Eliminar módulo ${mod.label}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </form>
        ) : null}
      </div>

      <ul className="flex-1 divide-y divide-slate-50 px-3 py-1">
        {mod.permissions.map((p) => (
          <li key={p.id} className="flex flex-col gap-0.5 py-2">
            <span className="text-xs font-medium text-slate-800">{p.label}</span>
            <span className="font-mono text-[10px] text-slate-500">{p.key}</span>
          </li>
        ))}
        {mod.permissions.length === 0 ? (
          <li className="py-6 text-center text-xs text-slate-500">Sin permisos registrados.</li>
        ) : null}
      </ul>

      {canManageModules ? (
        <form
          action={async (fd) => {
            await createAuthPermission(fd);
            onRefresh();
          }}
          className="grid gap-2 border-t border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <input type="hidden" name="moduleId" value={mod.id} />
          <Input name="key" placeholder={`${mod.key}.accion`} required className="h-8 bg-white text-xs" />
          <Input name="label" placeholder="Etiqueta" required className="h-8 bg-white text-xs" />
          <Button type="submit" size="sm" variant="outline" className="shadow-sm">
            Añadir
          </Button>
        </form>
      ) : null}
    </article>
  );
}
