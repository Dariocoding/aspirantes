"use client";

import { Crown, Lock, Plus, Shield, Users } from "lucide-react";
import { createAuthRole } from "@src/app/actions/rbac";
import type { RoleRow } from "@dashboard/sistema/roles/_components/types";
import { roleAccent, roleMetaClass } from "@dashboard/sistema/roles/_components/role-utils";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { cn } from "@src/lib/utils";

type Props = {
  roles: RoleRow[];
  selectedRoleId: string | null;
  onSelectRole: (role: RoleRow) => void;
  canManageRoles: boolean;
  onRefresh: () => void;
};

export function RolesListPanel({ roles, selectedRoleId, onSelectRole, canManageRoles, onRefresh }: Props) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
            <Shield className="h-4 w-4 text-slate-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-slate-900">Catálogo de roles</CardTitle>
            <CardDescription className="text-xs text-slate-600">
              Elija un rol para inspeccionar o editar su matriz de permisos.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <ul className="space-y-1.5" role="listbox" aria-label="Roles del sistema">
          {roles.map((role) => {
            const selected = selectedRoleId === role.id;
            return (
              <li key={role.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelectRole(role)}
                  className={cn(
                    "group flex w-full flex-col gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                    roleAccent(role, selected),
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        {role.isSuper ? (
                          <Crown className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                        ) : role.isSystem ? (
                          <Lock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                        ) : null}
                        <span className="truncate font-semibold text-sm">{role.label}</span>
                      </span>
                      <span className={cn("mt-0.5 block font-mono text-[11px]", roleMetaClass(role, selected))}>
                        {role.key}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
                        selected ? "bg-white/15 text-white/90" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      <Users className="h-3 w-3" aria-hidden />
                      {role.userCount}
                    </span>
                  </div>
                  {(role.isSuper || role.isSystem) && (
                    <div className="flex flex-wrap gap-1">
                      {role.isSuper ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 border-amber-300/50 bg-amber-500/20 text-[9px] text-amber-100",
                            !selected && "border-amber-200 bg-amber-100/80 text-amber-900",
                          )}
                        >
                          Acceso total
                        </Badge>
                      ) : null}
                      {role.isSystem ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 text-[9px]",
                            selected
                              ? "border-white/20 bg-white/10 text-white/80"
                              : "border-violet-200 bg-violet-100/80 text-violet-800",
                          )}
                        >
                          Sistema
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {canManageRoles ? (
          <form
            action={async (fd) => {
              await createAuthRole(fd);
              onRefresh();
            }}
            className="space-y-3 rounded-xl border border-dashed border-slate-300/90 bg-slate-50/60 p-3"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Nuevo rol
            </p>
            <div className="grid gap-2">
              <div>
                <Label htmlFor="role-key" className="text-xs text-slate-600">
                  Clave
                </Label>
                <Input
                  id="role-key"
                  name="key"
                  placeholder="ej. coordinador"
                  required
                  className="mt-1 h-8 bg-white text-sm"
                />
              </div>
              <div>
                <Label htmlFor="role-label" className="text-xs text-slate-600">
                  Nombre visible
                </Label>
                <Input id="role-label" name="label" required className="mt-1 h-8 bg-white text-sm" />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Crear rol
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
