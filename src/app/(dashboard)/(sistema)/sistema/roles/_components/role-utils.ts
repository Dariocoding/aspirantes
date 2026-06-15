import type { ModuleRow, RoleRow } from "@dashboard/sistema/roles/_components/types";
import { cn } from "@src/lib/utils";

export function totalPermissions(modules: ModuleRow[]) {
  return modules.reduce((n, m) => n + m.permissions.length, 0);
}

function permissionIdsInModules(modules: ModuleRow[]) {
  return modules.flatMap((m) => m.permissions.map((p) => p.id));
}

export function rolePermissionCoverage(
  role: RoleRow | null,
  modules: ModuleRow[],
  checkedPerms?: Set<string>,
) {
  const scopeIds = permissionIdsInModules(modules);
  const total = scopeIds.length;
  if (!role || role.isSuper || total === 0) return { enabled: total, total, percent: 100 };

  const enabled = checkedPerms
    ? scopeIds.filter((id) => checkedPerms.has(id)).length
    : role.permissionIds.filter((id) => scopeIds.includes(id)).length;

  return { enabled, total, percent: Math.round((enabled / total) * 100) };
}

export function roleAccent(role: RoleRow, selected: boolean) {
  if (role.isSuper) {
    return selected
      ? "border-amber-400/80 bg-linear-to-br from-amber-600 to-amber-800 text-white shadow-md shadow-amber-900/25"
      : "border-amber-200/90 bg-amber-50/90 text-amber-950 hover:border-amber-300 hover:bg-amber-50";
  }
  if (role.isSystem) {
    return selected
      ? "border-slate-700 bg-linear-to-br from-slate-800 to-slate-950 text-white shadow-md shadow-slate-900/20"
      : "border-violet-200/90 bg-violet-50/60 text-violet-950 hover:border-violet-300 hover:bg-violet-50";
  }
  return selected
    ? "border-primary/30 bg-linear-to-br from-primary to-[oklch(0.26_0.09_255)] text-primary-foreground shadow-md shadow-primary/20"
    : "border-border/80 bg-card text-foreground hover:border-primary/25 hover:bg-muted/40";
}

export function roleMetaClass(role: RoleRow, selected: boolean) {
  return cn(
    "text-[10px] font-medium uppercase tracking-wider",
    selected ? "text-white/70" : "text-muted-foreground",
  );
}
