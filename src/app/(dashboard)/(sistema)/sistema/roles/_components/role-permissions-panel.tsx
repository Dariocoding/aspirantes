"use client";

import { Crown, KeyRound, Save, Sparkles } from "lucide-react";
import { setRolePermissions } from "@src/app/actions/rbac";
import { RbacAppPermissionsBlock } from "@dashboard/sistema/roles/_components/rbac-app-block";
import { RoleEditPanel } from "@dashboard/sistema/roles/_components/role-edit-panel";
import type { ModuleRow, RoleRow } from "@dashboard/sistema/roles/_components/types";
import { rolePermissionCoverage } from "@dashboard/sistema/roles/_components/role-utils";
import { groupModulesByApp } from "@src/lib/auth/rbac-apps";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { cn } from "@src/lib/utils";

type Props = {
  modules: ModuleRow[];
  selectedRole: RoleRow | null;
  checkedPerms: Set<string>;
  canManageRoles: boolean;
  isDirty: boolean;
  onTogglePerm: (id: string) => void;
  onSetModulePerms: (ids: string[], enabled: boolean) => void;
  onRefresh: () => void;
};

export function RolePermissionsPanel({
  modules,
  selectedRole,
  checkedPerms,
  canManageRoles,
  isDirty,
  onTogglePerm,
  onSetModulePerms,
  onRefresh,
}: Props) {
  const appGroups = groupModulesByApp(modules);
  const coverage = rolePermissionCoverage(selectedRole, modules, checkedPerms);

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <KeyRound className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold text-slate-900">
                {selectedRole ? selectedRole.label : "Matriz de permisos"}
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                {!selectedRole
                  ? "Seleccione un rol del catálogo."
                  : selectedRole.isSuper
                    ? "El super administrador hereda todos los permisos sin configuración manual."
                    : `Permisos efectivos para «${selectedRole.label}».`}
              </CardDescription>
            </div>
          </div>
          {selectedRole && !selectedRole.isSuper ? (
            <div className="flex min-w-[140px] flex-col gap-1 sm:items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cobertura</span>
              <div className="flex w-full items-center gap-2 sm:w-44">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-primary to-[oklch(0.45_0.1_255)] transition-all duration-500"
                    style={{ width: `${coverage.percent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-800">{coverage.percent}%</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {coverage.enabled} de {coverage.total} permisos
              </span>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {!selectedRole ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
            <KeyRound className="h-8 w-8 text-slate-300" aria-hidden />
            <p className="text-sm font-medium text-slate-700">Ningún rol seleccionado</p>
            <p className="max-w-xs text-xs text-slate-500">Use el panel izquierdo para elegir un rol y ver su matriz.</p>
          </div>
        ) : selectedRole.isSuper ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200/80 bg-linear-to-br from-amber-50 to-amber-100/40 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700">
              <Crown className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-amber-950">Super administrador</p>
            <p className="max-w-md text-xs leading-relaxed text-amber-900/80">
              Este rol omite la matriz de permisos: cada acción autorizada en el sistema queda disponible
              automáticamente. No se asigna desde la interfaz de usuarios.
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-white/60 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
              <Sparkles className="h-3 w-3" aria-hidden />
              Acceso implícito total
            </span>
          </div>
        ) : (
          <>
            {canManageRoles ? <RoleEditPanel role={selectedRole} canManageRoles={canManageRoles} onRefresh={onRefresh} /> : null}

            <form
              action={async (fd) => {
                checkedPerms.forEach((id) => fd.append("permissionIds", id));
                await setRolePermissions(fd);
                onRefresh();
              }}
              className="space-y-3"
            >
              <input type="hidden" name="roleId" value={selectedRole.id} />
              <div className="space-y-4">
                {appGroups.map((group) => (
                  <RbacAppPermissionsBlock
                    key={group.appId}
                    group={group}
                    selectedRole={selectedRole}
                    checkedPerms={checkedPerms}
                    canManageRoles={canManageRoles}
                    onTogglePerm={onTogglePerm}
                    onSetModulePerms={onSetModulePerms}
                  />
                ))}
              </div>

              {canManageRoles ? (
                <div
                  className={cn(
                    "sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-0 sm:rounded-xl sm:border sm:shadow-sm",
                    isDirty && "border-primary/20 ring-1 ring-primary/10",
                  )}
                >
                  <p className="text-xs text-slate-600">
                    {isDirty ? (
                      <span className="font-medium text-primary">Cambios sin guardar</span>
                    ) : (
                      "Matriz sincronizada con el servidor"
                    )}
                  </p>
                  <Button type="submit" size="sm" className="gap-1.5 shadow-sm" disabled={!isDirty}>
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    Guardar permisos
                  </Button>
                </div>
              ) : null}
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
