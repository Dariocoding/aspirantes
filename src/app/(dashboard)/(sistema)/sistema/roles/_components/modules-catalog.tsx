"use client";

import { Layers, Plus } from "lucide-react";
import { createAuthModule } from "@src/app/actions/rbac";
import { ModuleCard } from "@dashboard/sistema/roles/_components/module-card";
import { RbacAppCatalogBlock } from "@dashboard/sistema/roles/_components/rbac-app-block";
import type { ModuleRow } from "@dashboard/sistema/roles/_components/types";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { groupModulesByApp } from "@src/lib/auth/rbac-apps";
import type { AppId } from "@src/lib/apps/registry";

type Props = {
  modules: ModuleRow[];
  canManageModules: boolean;
  onRefresh: () => void;
};

function ModuleCreateForm({ appId, onRefresh }: { appId: AppId; onRefresh: () => void }) {
  const isPersonal = appId === "personal";

  return (
    <form
      action={async (fd) => {
        await createAuthModule(fd);
        onRefresh();
      }}
      className={
        isPersonal
          ? "space-y-3 rounded-xl border border-dashed border-emerald-300/70 bg-emerald-50/40 p-3"
          : "space-y-3 rounded-xl border border-dashed border-sky-300/70 bg-sky-50/40 p-3"
      }
    >
      <input type="hidden" name="appId" value={appId} />
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Nuevo módulo en esta aplicación
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor={`mod-key-${appId}`} className="text-xs text-slate-600">
            Clave
          </Label>
          <Input
            id={`mod-key-${appId}`}
            name="key"
            placeholder={isPersonal ? "ej. reportes" : "ej. integraciones"}
            required
            className="mt-1 h-8 bg-white text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`mod-label-${appId}`} className="text-xs text-slate-600">
            Nombre
          </Label>
          <Input id={`mod-label-${appId}`} name="label" required className="mt-1 h-8 bg-white text-sm" />
        </div>
      </div>
      <Button type="submit" size="sm" className="gap-1.5 shadow-sm">
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Crear módulo
      </Button>
    </form>
  );
}

export function ModulesCatalog({ modules, canManageModules, onRefresh }: Props) {
  const appGroups = groupModulesByApp(modules);

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
            <Layers className="h-4 w-4 text-slate-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">Módulos por aplicación</CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Misma división que el portal: gestión de personal y usuarios del sistema. Cada permiso usa la clave{" "}
              <span className="font-mono text-[10px]">modulo.accion</span>.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 xl:grid-cols-2">
        {appGroups.map((group) => (
          <RbacAppCatalogBlock
            key={group.appId}
            group={group}
            canManageModules={canManageModules}
            onRefresh={onRefresh}
            renderModuleCard={(mod) => (
              <ModuleCard mod={mod} canManageModules={canManageModules} onRefresh={onRefresh} />
            )}
            renderCreateForm={(appId) => <ModuleCreateForm appId={appId} onRefresh={onRefresh} />}
          />
        ))}
      </CardContent>
    </Card>
  );
}
