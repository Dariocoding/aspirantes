import { LayoutGrid, Shield } from "lucide-react";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import { cn } from "@src/lib/utils";

type HubPortalHeroProps = {
  userName: string | null | undefined;
  roleLabel: string;
  appCount: number;
};

function displayFirstName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) return "Usuario";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function HubPortalHero({ userName, roleLabel, appCount }: HubPortalHeroProps) {
  const firstName = displayFirstName(userName);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200/90",
        "bg-linear-to-br from-[#0a1812]/[0.03] via-white to-amber-50/50",
        "shadow-sm shadow-slate-900/5",
      )}
    >
      <FanbFlagStripe className="absolute inset-x-0 top-0 z-10 rounded-t-2xl" />
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-900/[0.06] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-500/[0.08] blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 p-5 pt-7 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:p-6 sm:pt-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-900/15 bg-linear-to-br from-emerald-950 to-[#0b1520] text-amber-100 shadow-md shadow-emerald-950/20">
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-900/70">
              Fuerza Armada Nacional Bolivariana
            </p>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
              Portal de aplicaciones
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600">
              Bienvenido,{" "}
              <span className="font-medium text-slate-900">{firstName}</span>. Seleccione el módulo con el que
              desea trabajar; el menú lateral se adaptará a su elección y permisos asignados.
            </p>
          </div>
        </div>

        <dl className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3.5 py-1.5 text-xs shadow-sm backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-emerald-800/80" aria-hidden />
            <dt className="text-slate-500">Perfil</dt>
            <dd className="max-w-[12rem] truncate font-medium text-slate-900">{roleLabel}</dd>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-3.5 py-1.5 text-xs shadow-sm">
            <dt className="text-amber-900/70">Módulos disponibles</dt>
            <dd className="font-semibold tabular-nums text-amber-950">{appCount}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
