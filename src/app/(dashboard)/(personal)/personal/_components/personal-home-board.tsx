import Link from "next/link";
import { CefoaCrest } from "@src/components/institution/cefoa-crest";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import {
  FANB_APP_SHELL_GRADIENT,
  INSTITUTION_BRANCH,
  INSTITUTION_NAME,
  INSTITUTION_SHORT_NAME,
} from "@src/lib/branding";
import { routes } from "@src/lib/apps/routes";
import { cn } from "@src/lib/utils";

export type PersonalHomeBirthday = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  fechaLabel: string;
  esHoy: boolean;
  edadQueCumple: number | null;
};

export type PersonalHomeEfemeride = {
  id: string;
  nombre: string;
  fechaLabel: string;
  dias: number;
};

export type PersonalHomePeloton = {
  id: string;
  label: string;
  count: number;
};

type Props = {
  fechaLarga: string;
  fechaCorta: string;
  nombreMes: string;
  convocatoria: { nombre: string; codigo: string; anio: number; comandanteNombre: string | null } | null;
  total: number;
  masculinos: number;
  femeninos: number;
  edadPromedio: number;
  sinPeloton: number;
  pelotones: PersonalHomePeloton[];
  cumpleanosDelMes: PersonalHomeBirthday[];
  proximasEfemerides: PersonalHomeEfemeride[];
};

const GOLD = "#d4af37";

function CornerMarks({ className }: { className?: string }) {
  const arm = "pointer-events-none absolute h-5 w-5 border-[#d4af37]/70";
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className={cn(arm, "top-2 left-2 border-t border-l")} />
      <span className={cn(arm, "top-2 right-2 border-t border-r")} />
      <span className={cn(arm, "bottom-2 left-2 border-b border-l")} />
      <span className={cn(arm, "right-2 bottom-2 border-r border-b")} />
    </div>
  );
}

function SectionKicker({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.28em] text-amber-700/80 uppercase">{children}</p>
  );
}

function EfectivoStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 border-l border-amber-400/25 pl-4 first:border-l-0 first:pl-0">
      <p className="text-[10px] font-semibold tracking-[0.22em] text-amber-200/55 uppercase">{label}</p>
      <p className="font-display mt-1 text-3xl font-semibold tracking-tight text-amber-50 tabular-nums sm:text-4xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function PersonalHomeBoard({
  fechaLarga,
  fechaCorta,
  nombreMes,
  convocatoria,
  total,
  masculinos,
  femeninos,
  edadPromedio,
  sinPeloton,
  pelotones,
  cumpleanosDelMes,
  proximasEfemerides,
}: Props) {
  const maxPeloton = Math.max(1, ...pelotones.map((p) => p.count), sinPeloton);
  const pctHombres = total ? Math.round((masculinos / total) * 100) : 0;
  const pctMujeres = total ? Math.round((femeninos / total) * 100) : 0;
  const honoresHoy = cumpleanosDelMes.filter((p) => p.esHoy).length;

  return (
    <article className="relative min-w-0 overflow-hidden rounded-sm border border-amber-900/40 shadow-[0_24px_60px_-28px_rgba(8,12,20,0.65)]">
      <FanbFlagStripe className="h-1.5" />

      <div className={cn("relative text-slate-100", FANB_APP_SHELL_GRADIENT)}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 11px, #d4af37 11px, #d4af37 12px)",
          }}
          aria-hidden
        />
        <CornerMarks />

        <header className="relative grid gap-6 px-5 pt-7 pb-6 sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <CefoaCrest size="md" priority className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]" />

          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.34em] text-amber-200/80 uppercase">
              {INSTITUTION_BRANCH} · Uso interno
            </p>
            <h1 className="font-display mt-2 text-balance text-3xl font-semibold tracking-[0.08em] text-amber-50 sm:text-4xl">
              Puesto de mando
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-slate-300">
              {INSTITUTION_SHORT_NAME} — {INSTITUTION_NAME}. Parte diario de efectivos, honores y calendario
              institucional.
            </p>
          </div>

          <div className="justify-self-start border border-amber-400/30 bg-black/25 px-4 py-3 text-right lg:justify-self-end">
            <p className="font-mono text-xs tracking-[0.2em] text-amber-200 uppercase">{fechaCorta}</p>
            <p className="mt-1 text-[11px] text-slate-400 capitalize">{fechaLarga}</p>
            <p className="mt-2 text-[10px] tracking-[0.18em] text-amber-200/50 uppercase">Orden del día</p>
          </div>
        </header>

        <div className="relative mx-5 mb-6 border border-dashed border-amber-400/25 bg-black/20 px-4 py-3 sm:mx-8">
          {convocatoria ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.24em] text-amber-200/60 uppercase">
                  Convocatoria en vigor
                </p>
                <p className="mt-1 font-medium text-amber-50">{convocatoria.nombre}</p>
                <p className="font-mono text-xs text-slate-400">
                  {convocatoria.codigo} · {convocatoria.anio}
                  {convocatoria.comandanteNombre ? ` · Cmte. ${convocatoria.comandanteNombre}` : null}
                </p>
              </div>
              <span
                className="inline-flex -rotate-6 items-center border-2 px-3 py-1 text-[11px] font-bold tracking-[0.2em] uppercase"
                style={{ borderColor: GOLD, color: GOLD }}
              >
                Activa
              </span>
            </div>
          ) : (
            <p className="text-sm text-amber-100/90">
              No hay convocatoria activa. Un administrador debe abrir un período en Convocatorias para mostrar el
              censo en este parte.
            </p>
          )}
        </div>

        <section className="relative grid gap-6 px-5 pb-7 sm:grid-cols-2 sm:px-8 xl:grid-cols-4">
          <EfectivoStat label="Efectivos" value={String(total)} hint="Aspirantes en el censo activo" />
          <EfectivoStat label="Varones" value={String(masculinos)} hint={total ? `${pctHombres}% del curso` : "Sin censo"} />
          <EfectivoStat label="Damas" value={String(femeninos)} hint={total ? `${pctMujeres}% del curso` : "Sin censo"} />
          <EfectivoStat
            label="Edad media"
            value={edadPromedio.toFixed(1)}
            hint={honoresHoy ? `${honoresHoy} honor${honoresHoy === 1 ? "" : "es"} hoy` : "Años cumplidos"}
          />
        </section>
      </div>

      <div className="relative bg-[#f4efe4] px-5 py-6 sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(90,70,40,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(90,70,40,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-w-0 border border-amber-900/15 bg-[#fbf7ee] p-4 shadow-sm sm:p-5">
            <SectionKicker>Estructura de pelotones</SectionKicker>
            <h2 className="mt-1 font-semibold tracking-wide text-slate-900">Fuerza por unidad</h2>
            {pelotones.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                {convocatoria
                  ? "Esta convocatoria aún no tiene pelotones definidos."
                  : "Sin convocatoria activa no hay estructura de pelotones."}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {pelotones.map((p) => (
                  <li key={p.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
                        {p.label}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-500">{p.count}</span>
                    </div>
                    <div className="h-1.5 bg-amber-950/10">
                      <div
                        className="h-full bg-[#1a2a18]"
                        style={{ width: `${Math.max(4, (p.count / maxPeloton) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
                {sinPeloton > 0 ? (
                  <li>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold tracking-[0.12em] text-amber-900 uppercase">
                        Sin pelotón
                      </span>
                      <span className="font-mono text-xs tabular-nums text-amber-800">{sinPeloton}</span>
                    </div>
                    <div className="h-1.5 bg-amber-950/10">
                      <div
                        className="h-full bg-amber-700/80"
                        style={{ width: `${Math.max(4, (sinPeloton / maxPeloton) * 100)}%` }}
                      />
                    </div>
                  </li>
                ) : null}
              </ul>
            )}

            <nav className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Accesos de operación">
              {[
                { href: routes.personal.aspirantes, label: "Censo" },
                { href: routes.personal.esquelas, label: "Esquelas" },
                { href: routes.personal.efemerides, label: "Efemérides" },
                { href: routes.personal.convocatorias, label: "Convocatorias" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-amber-950/20 bg-white/60 px-3 py-2 text-center text-[11px] font-semibold tracking-[0.18em] text-slate-800 uppercase transition-colors hover:border-amber-800 hover:bg-amber-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <section className="min-w-0 border border-amber-900/15 bg-[#fbf7ee] p-4 shadow-sm sm:p-5">
              <SectionKicker>Parte de honores</SectionKicker>
              <h2 className="mt-1 font-semibold tracking-wide text-slate-900">Cumpleaños de {nombreMes}</h2>
              <div className="mt-4 max-h-112 space-y-2 overflow-y-auto pr-1">
                {cumpleanosDelMes.length === 0 ? (
                  <p className="text-sm text-slate-600">Nadie del censo activo cumple años este mes.</p>
                ) : (
                  cumpleanosDelMes.map((persona, index) => (
                    <div
                      key={persona.id}
                      className={cn(
                        "border-l-2 px-3 py-2",
                        persona.esHoy
                          ? "border-amber-600 bg-amber-100/80"
                          : "border-amber-900/20 bg-white/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[10px] font-mono tracking-wider text-slate-400 tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        {persona.esHoy ? (
                          <span className="text-[10px] font-bold tracking-[0.16em] text-amber-900 uppercase">
                            Honores hoy
                          </span>
                        ) : null}
                      </div>
                      <p className="font-medium text-slate-900">
                        {persona.nombres} {persona.apellidos}
                      </p>
                      <p className="text-xs text-slate-600">
                        C.I. {persona.cedula}
                        {persona.edadQueCumple != null ? (
                          <>
                            {" · "}
                            <span className="tabular-nums">{persona.edadQueCumple}</span> años
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs font-medium tracking-wide text-slate-700 tabular-nums">
                        {persona.fechaLabel}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="min-w-0 border border-amber-900/15 bg-[#fbf7ee] p-4 shadow-sm sm:p-5">
              <SectionKicker>Calendario institucional</SectionKicker>
              <h2 className="mt-1 font-semibold tracking-wide text-slate-900">Próximas efemérides</h2>
              <p className="mt-1 text-xs text-slate-500">Ventana de 15 días.</p>
              <div className="mt-4 space-y-2">
                {proximasEfemerides.length === 0 ? (
                  <p className="text-sm text-slate-600">No hay efemérides en los próximos 15 días.</p>
                ) : (
                  proximasEfemerides.map((item) => (
                    <div key={item.id} className="flex gap-3 border-b border-amber-900/10 py-2 last:border-0">
                      <div className="w-14 shrink-0 text-center">
                        <p className="font-display text-2xl font-semibold text-[#1a2a18] tabular-nums leading-none">
                          {item.dias}
                        </p>
                        <p className="mt-1 text-[9px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                          {item.dias === 1 ? "día" : "días"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{item.nombre}</p>
                        <p className="text-xs text-slate-600">{item.fechaLabel}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        <p className="relative mt-6 text-center text-[10px] tracking-[0.22em] text-amber-900/50 uppercase">
          Honor · Disciplina · Lealtad · {INSTITUTION_SHORT_NAME}
        </p>
      </div>
    </article>
  );
}
