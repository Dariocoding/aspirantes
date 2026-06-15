"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, Shield, Users, Warehouse } from "lucide-react";
import { PermissionModuleGroup } from "@dashboard/sistema/roles/_components/permission-module-group";
import type { ModuleRow, RoleRow } from "@dashboard/sistema/roles/_components/types";
import { rolePermissionCoverage } from "@dashboard/sistema/roles/_components/role-utils";
import type { ModulesByAppGroup } from "@src/lib/auth/rbac-apps";
import type { AppId } from "@src/lib/apps/registry";
import { cn } from "@src/lib/utils";

const APP_VISUAL: Record<
  AppId,
  {
    icon: typeof Users;
    header: string;
    badge: string;
    ring: string;
  }
> = {
  personal: {
    icon: Users,
    header: "border-emerald-200/80 bg-linear-to-r from-emerald-50/90 to-white",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-900",
    ring: "ring-emerald-500/10",
  },
  sistema: {
    icon: Shield,
    header: "border-sky-200/80 bg-linear-to-r from-sky-50/90 to-white",
    badge: "border-sky-200 bg-sky-50 text-sky-900",
    ring: "ring-sky-500/10",
  },
  inventario: {
    icon: Warehouse,
    header: "border-amber-200/80 bg-linear-to-r from-amber-50/90 to-white",
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    ring: "ring-amber-500/10",
  },
};

type PermissionsBlockProps = {
  group: ModulesByAppGroup;
  selectedRole: RoleRow;
  checkedPerms: Set<string>;
  canManageRoles: boolean;
  onTogglePerm: (id: string) => void;
  onSetModulePerms: (ids: string[], enabled: boolean) => void;
};

export function RbacAppPermissionsBlock({
  group,
  selectedRole,
  checkedPerms,
  canManageRoles,
  onTogglePerm,
  onSetModulePerms,
}: PermissionsBlockProps) {
  const [open, setOpen] = useState(false);
  const visual = APP_VISUAL[group.appId];
  const Icon = visual.icon;
  const coverage = rolePermissionCoverage(selectedRole, group.modules, checkedPerms);

  if (group.modules.length === 0) return null;

  return (
    <section className={cn("overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1", visual.ring)}>
      <div className={cn("flex items-center gap-2 border-b px-2 py-2", visual.header)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-black/5"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")}
            aria-hidden
          />
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm",
              group.appId === "personal"
                ? "border-emerald-200/90 text-emerald-800"
                : group.appId === "inventario"
                  ? "border-amber-200/90 text-amber-800"
                  : "border-sky-200/90 text-sky-800",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">{group.name}</span>
            <span className="block text-[11px] text-slate-600">{group.shortName}</span>
          </span>
        </button>
        <span
          className={cn(
            "mr-1 inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
            visual.badge,
          )}
        >
          {coverage.enabled}/{coverage.total}
          <span className="font-normal opacity-75">permisos</span>
        </span>
      </div>
      {open ? (
        <div className="space-y-2 p-2">
          {group.modules.map((mod) => (
            <PermissionModuleGroup
              key={mod.id}
              module={mod}
              checkedPerms={checkedPerms}
              canManageRoles={canManageRoles}
              onTogglePerm={onTogglePerm}
              onSetModulePerms={onSetModulePerms}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

type CatalogBlockProps = {
  group: ModulesByAppGroup;
  canManageModules: boolean;
  onRefresh: () => void;
  renderModuleCard: (mod: ModuleRow) => ReactNode;
  renderCreateForm: (appId: AppId) => ReactNode;
};

export function RbacAppCatalogBlock({
  group,
  canManageModules,
  onRefresh: _onRefresh,
  renderModuleCard,
  renderCreateForm,
}: CatalogBlockProps) {
  const [open, setOpen] = useState(false);
  const visual = APP_VISUAL[group.appId];
  const DisplayIcon = group.appId === "sistema" ? Shield : group.appId === "inventario" ? Warehouse : Users;
  const permCount = group.modules.reduce((n, m) => n + m.permissions.length, 0);

  return (
    <section className={cn("overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1", visual.ring)}>
      <div className={cn("flex items-center gap-2 border-b px-2 py-2", visual.header)}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-black/5"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")}
            aria-hidden
          />
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm",
              group.appId === "personal"
                ? "border-emerald-200/90 text-emerald-800"
                : group.appId === "inventario"
                  ? "border-amber-200/90 text-amber-800"
                  : "border-sky-200/90 text-sky-800",
            )}
          >
            <DisplayIcon className="h-4 w-4" aria-hidden />
          </div>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">{group.name}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">{group.description}</span>
          </span>
        </button>
        <span
          className={cn(
            "mr-1 hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tabular-nums sm:inline-flex",
            visual.badge,
          )}
        >
          {group.modules.length} mód. · {permCount} perm.
        </span>
      </div>
      {open ? (
        <div className="space-y-3 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 sm:hidden">
            {group.modules.length} módulo{group.modules.length === 1 ? "" : "s"} · {permCount} permisos
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.modules.map((mod) => renderModuleCard(mod))}
          </div>
          {canManageModules ? renderCreateForm(group.appId) : null}
        </div>
      ) : null}
    </section>
  );
}
