import Link from "next/link";
import type { ReactNode } from "react";
import { BookMarked, CalendarDays, Medal, Users, type LucideIcon } from "lucide-react";
import { AspiranteIdentityLink } from "@dashboard/aspirantes/_components/aspirante-foto";
import { CefoaCrest } from "@src/components/institution/cefoa-crest";
import { FanbFlagStripe } from "@src/components/institution/fanb-flag-stripe";
import { INSTITUTION_SHORT_NAME } from "@src/lib/branding";
import { routes } from "@src/lib/apps/routes";
import { cn } from "@src/lib/utils";

export type PersonalHomeBirthday = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  fotoKey: string | null;
  dia: number;
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

const PELOTON_TONES = ["#3b82f6", "#22c55e", "#38bdf8", "#84cc16", "#06b6d4"] as const;

const SHORTCUTS: { href: string; label: string; hint: string; icon: LucideIcon; tone: string }[] = [
  {
    href: routes.personal.aspirantes,
    label: "Censo",
    hint: "Aspirantes",
    icon: Users,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    href: routes.personal.esquelas,
    label: "Esquelas",
    hint: "Honores",
    icon: Medal,
    tone: "bg-amber-50 text-amber-800",
  },
  {
    href: routes.personal.efemerides,
    label: "Efemérides",
    hint: "Calendario",
    icon: CalendarDays,
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    href: routes.personal.convocatorias,
    label: "Convocatorias",
    hint: "Períodos",
    icon: BookMarked,
    tone: "bg-indigo-50 text-indigo-700",
  },
];

function Kpi({
  label,
  value,
  hint,
  hintWarn,
}: {
  label: string;
  value: string;
  hint?: string;
  hintWarn?: boolean;
}) {
  return (
    <div className="min-w-0 bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-0.5 text-xl font-semibold leading-none text-slate-900 tabular-nums">{value}</p>
      {hint ? (
        <p className={cn("mt-1 truncate text-[11px]", hintWarn ? "text-amber-800" : "text-slate-500")}>{hint}</p>
      ) : null}
    </div>
  );
}

function PanelHeader({
  title,
  aside,
}: {
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {aside}
    </div>
  );
}

export function PersonalHomeBoard({
  fechaLarga,
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
  const pctHombres = total ? Math.round((masculinos / total) * 100) : 0;
  const pctMujeres = total ? Math.round((femeninos / total) * 100) : 0;
  const hoyCount = cumpleanosDelMes.filter((p) => p.esHoy).length;

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-3">
      <header className="flex min-w-0 flex-wrap items-center gap-3">
        <CefoaCrest size="sm" priority className="drop-shadow-none" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Personal</h1>
          <p className="truncate text-xs text-slate-500">
            {INSTITUTION_SHORT_NAME}
            <span className="text-slate-300"> · </span>
            <span>{fechaLarga}</span>
          </p>
        </div>
        {convocatoria ? (
          <p className="max-w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-right text-xs">
            <span className="font-medium text-slate-900">{convocatoria.codigo}</span>
            <span className="mt-0.5 block max-w-64 truncate text-slate-500">{convocatoria.nombre}</span>
          </p>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
            Sin convocatoria activa
          </p>
        )}
      </header>

      {!convocatoria ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          No hay cifras de censo hasta que un administrador active un período en{" "}
          <Link href={routes.personal.convocatorias} className="font-medium underline underline-offset-2">
            Convocatorias
          </Link>
          .
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-slate-200">
        <FanbFlagStripe className="h-1" />
        <div className="flex flex-wrap gap-px bg-slate-200">
          <div className="min-w-36 flex-1">
            <Kpi label="Aspirantes" value={String(total)} hint={convocatoria ? "Censo activo" : "Sin período"} />
          </div>
          <div className="min-w-36 flex-1 bg-white px-3 py-2.5">
            <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Composición</p>
            <p className="mt-0.5 text-xl font-semibold leading-none text-slate-900 tabular-nums">
              {masculinos}
              <span className="mx-1 text-sm font-medium text-slate-400">/</span>
              {femeninos}
            </p>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-sm bg-slate-100">
              <span className="bg-[#0c1424]" style={{ width: `${pctHombres}%` }} />
              <span className="bg-[#b45309]" style={{ width: `${pctMujeres}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Varones · damas</p>
          </div>
          <div className="min-w-36 flex-1">
            <Kpi label="Edad media" value={edadPromedio.toFixed(1)} hint="Años cumplidos" />
          </div>
          <div className="min-w-36 flex-1">
            <Kpi
              label="Pelotones"
              value={String(pelotones.length)}
              hint={`${sinPeloton} sin asignar`}
              hintWarn={sinPeloton > 0}
            />
          </div>
          <div className="min-w-36 flex-1">
            <Kpi label="Hoy" value={String(hoyCount)} hint="Cumpleaños" />
          </div>
        </div>
      </section>

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Atajos">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", item.tone)}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900">{item.label}</span>
                <span className="block text-[11px] text-slate-500">{item.hint}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {pelotones.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Fuerza por pelotón</h2>
          <div className="flex h-2.5 overflow-hidden rounded-sm bg-slate-100">
            {pelotones.map((p, i) => (
              <span
                key={p.id}
                className={cn(p.count === 0 && "opacity-20")}
                style={{
                  backgroundColor: PELOTON_TONES[i % PELOTON_TONES.length],
                  flexGrow: Math.max(p.count, 0.35),
                }}
                title={`${p.label}: ${p.count}`}
              />
            ))}
            {sinPeloton > 0 ? (
              <span className="bg-amber-500" style={{ flexGrow: sinPeloton }} title={`Sin pelotón: ${sinPeloton}`} />
            ) : null}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {pelotones.map((p, i) => (
              <li key={p.id} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: PELOTON_TONES[i % PELOTON_TONES.length] }}
                />
                <span className="truncate">{p.label}</span>
                <span className="font-medium text-slate-900 tabular-nums">{p.count}</span>
              </li>
            ))}
            {sinPeloton > 0 ? (
              <li className="flex items-center gap-1.5 text-[11px] text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Sin pelotón
                <span className="font-medium tabular-nums">{sinPeloton}</span>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <PanelHeader
            title={`Cumpleaños · ${nombreMes}`}
            aside={
              <span className="text-[11px] text-slate-400 tabular-nums">{cumpleanosDelMes.length}</span>
            }
          />
          {cumpleanosDelMes.length === 0 ? (
            <p className="px-3 py-6 text-sm text-slate-500">Nadie del censo activo cumple años este mes.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {cumpleanosDelMes.map((persona) => (
                <li
                  key={persona.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5",
                    persona.esHoy && "bg-amber-50",
                  )}
                >
                  <AspiranteIdentityLink
                    aspiranteId={persona.id}
                    fotoKey={persona.fotoKey}
                    nombre={`${persona.nombres} ${persona.apellidos}`}
                    size="sm"
                    className="min-w-0 flex-1"
                  >
                    <span className="truncate text-[11px] text-slate-500">
                      C.I. {persona.cedula}
                      {persona.edadQueCumple != null ? (
                        <>
                          {" · "}
                          <span className="tabular-nums">{persona.edadQueCumple}</span> años
                        </>
                      ) : null}
                    </span>
                  </AspiranteIdentityLink>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-1 text-right",
                      persona.esHoy ? "bg-amber-800 text-amber-50" : "bg-slate-100 text-slate-700",
                    )}
                  >
                    <span className="block text-[11px] font-semibold leading-none capitalize">
                      {persona.fechaLabel}
                    </span>
                    {persona.esHoy ? (
                      <span className="mt-0.5 block text-[10px] font-semibold tracking-wide uppercase">
                        Hoy
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <PanelHeader
            title="Efemérides · 15 días"
            aside={
              <Link href={routes.personal.efemerides} className="text-xs font-medium text-slate-500 hover:text-slate-900">
                Ver todas
              </Link>
            }
          />
          {proximasEfemerides.length === 0 ? (
            <p className="px-3 py-6 text-sm text-slate-500">No hay efemérides en los próximos 15 días.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {proximasEfemerides.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-1.5">
                  <span className="w-10 shrink-0 text-center">
                    <span className="block text-sm font-semibold text-slate-900 tabular-nums leading-none">
                      {item.dias}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.dias === 1 ? "día" : "días"}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.nombre}</p>
                    <p className="truncate text-[11px] text-slate-500">{item.fechaLabel}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
