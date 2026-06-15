import Link from "next/link";
import { ArrowRight, FileSearch, Users, Warehouse } from "lucide-react";
import type { AppDefinition, AppId } from "@src/lib/apps/registry";
import { cn } from "@src/lib/utils";

const appIcons = {
  personal: Users,
  sistema: FileSearch,
  inventario: Warehouse,
} as const;

const appHighlights: Record<AppId, readonly string[]> = {
  personal: ["Censo y registro de aspirantes", "Efemérides, esquelas y convocatorias", "Reportes e impresión documental"],
  sistema: ["Administración de usuarios", "Roles y permisos por módulo", "Registro de auditoría del sistema"],
  inventario: ["Inventario del rancho", "Alertas de stock bajo y reposición", "Historial de entradas y salidas"],
};

const appAccent = {
  personal: {
    card: "hover:border-emerald-800/25 hover:shadow-emerald-950/10",
    icon: "from-emerald-900 to-[#0a1812] shadow-emerald-950/25",
    ring: "group-hover:ring-emerald-900/15",
    button:
      "border-emerald-950/40 bg-emerald-900 text-amber-50 shadow-sm group-hover:bg-emerald-950 group-hover:shadow-md",
    dot: "bg-emerald-700/80",
  },
  sistema: {
    card: "hover:border-slate-400/40 hover:shadow-slate-900/10",
    icon: "from-slate-800 to-slate-950 shadow-slate-900/25",
    ring: "group-hover:ring-slate-400/20",
    button:
      "border-slate-900/50 bg-slate-800 text-white shadow-sm group-hover:bg-slate-900 group-hover:shadow-md",
    dot: "bg-slate-600/80",
  },
  inventario: {
    card: "hover:border-amber-700/25 hover:shadow-amber-950/10",
    icon: "from-amber-800 to-amber-950 shadow-amber-950/25",
    ring: "group-hover:ring-amber-700/15",
    button:
      "border-amber-900/40 bg-amber-800 text-amber-50 shadow-sm group-hover:bg-amber-950 group-hover:shadow-md",
    dot: "bg-amber-700/80",
  },
} as const;

type AppLauncherProps = {
  apps: AppDefinition[];
};

export function AppLauncher({ apps }: AppLauncherProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Módulos disponibles</h2>
          <p className="mt-0.5 text-xs text-slate-500">Haga clic en una tarjeta para ingresar al área de trabajo.</p>
        </div>
      </div>

      <ul
        className={cn(
          "grid list-none gap-4 p-0",
          apps.length === 1 ? "max-w-xl" : "sm:grid-cols-2",
        )}
      >
        {apps.map((app) => {
          const Icon = appIcons[app.id];
          const accent = appAccent[app.id];
          const highlights = appHighlights[app.id];

          return (
            <li key={app.id} className="min-w-0">
              <Link
                href={app.homeHref}
                className={cn(
                  "group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white",
                  "shadow-sm shadow-slate-900/5 transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/45 focus-visible:ring-offset-2",
                  accent.card,
                  accent.ring,
                  "ring-1 ring-transparent",
                )}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-slate-50/90 to-transparent"
                  aria-hidden
                />

                <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-amber-50 shadow-md",
                        accent.icon,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span
                      className={cn(
                        "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-400 transition-all",
                        "group-hover:border-amber-200/80 group-hover:bg-amber-50 group-hover:text-amber-900",
                      )}
                      aria-hidden
                    >
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {app.shortName}
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">{app.name}</h3>
                    <p className="text-pretty text-sm leading-relaxed text-slate-600">{app.description}</p>
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    {highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                        <span
                          className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)}
                          aria-hidden
                        />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <span
                    className={cn(
                      "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5",
                      "text-sm font-semibold transition-all duration-200",
                      accent.button,
                    )}
                  >
                    Ingresar al módulo
                    <ArrowRight
                      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
