import { KeyRound, Layers, Shield } from "lucide-react";
import type { ModuleRow, RoleRow } from "@dashboard/sistema/roles/_components/types";
import { totalPermissions } from "@dashboard/sistema/roles/_components/role-utils";
import { rbacAppSummaries } from "@src/lib/auth/rbac-apps";
import { cn } from "@src/lib/utils";

type Props = {
  roles: RoleRow[];
  modules: ModuleRow[];
};

function StatPill({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Shield;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4 text-white/90" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">{label}</p>
        <p className="text-lg font-semibold tabular-nums leading-none text-white">{value}</p>
      </div>
    </div>
  );
}

export function RolesPageHeader({ roles, modules }: Props) {
  const permCount = totalPermissions(modules);
  const appSummaries = rbacAppSummaries(modules);

  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-800/10 bg-linear-to-br from-[oklch(0.28_0.07_255)] via-[oklch(0.32_0.08_255)] to-[oklch(0.24_0.06_265)] px-5 py-5 text-white shadow-lg shadow-slate-900/15 sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Administración · Seguridad
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">Roles y permisos</h1>
          <p className="text-sm leading-relaxed text-white/75">
            Configure el modelo de acceso por aplicación: gestión de personal y usuarios del sistema. El super
            administrador conserva acceso total y no se asigna desde la interfaz.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {appSummaries.map((app) => (
              <span
                key={app.appId}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] text-white/85"
              >
                <span className="font-medium">{app.shortName}</span>
                <span className="text-white/50">·</span>
                <span className="tabular-nums">
                  {app.moduleCount} mód. · {app.permissionCount} perm.
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatPill icon={Shield} label="Roles" value={roles.length} />
          <StatPill icon={Layers} label="Módulos" value={modules.length} />
          <StatPill icon={KeyRound} label="Permisos" value={permCount} />
        </div>
      </div>
    </header>
  );
}
