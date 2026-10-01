"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { applySelectionParam, useCensusNavigate } from "@dashboard/aspirantes/_components/census-selection";
import {
  useState,
  type ComponentProps,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  BookMarked,
  Cake,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsUp,
  Church,
  CircleDashed,
  Clock3,
  GraduationCap,
  Hash,
  IdCard,
  Layers,
  List,
  PanelLeft,
  Search,
  Shield,
  Signature,
  Type,
  Users,
  X,
} from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  censusQueryString,
  resolveCensusPresentation,
  sexoEtiqueta,
  type CensusGroupKey,
  type CensusSortKey,
} from "@src/lib/aspirantes/census";
import {
  condicionCensusTotal,
  labelCondicionCensusFilter,
  parseCondicionCensusFilter,
  type CondicionCensusCounts,
  type CondicionCensusFilter,
} from "@src/lib/aspirantes/condicion-militar";
import { routes } from "@src/lib/apps/routes";
import { labelPeloton, type PelotonResumen } from "@src/lib/pelotones";
import { cn } from "@src/lib/utils";

type ConvocatoriaOption = { id: string; codigo: string; nombre: string; activa: boolean };

type FilterValues = {
  q?: string;
  sexo?: string;
  sort?: string;
  group?: string;
  peloton?: string;
  convocatoria?: string;
  condicion?: string;
};

type PelotonOption = PelotonResumen & { convocatoriaId: string };

type Props = {
  pelotones: PelotonOption[];
  convocatorias: ConvocatoriaOption[];
  defaultConvocatoriaId: string;
  condicionCounts: Record<string, CondicionCensusCounts>;
};

const EMPTY_CONDICION_COUNTS: CondicionCensusCounts = { soldado: 0, sargento: 0, sin: 0 };

const SORT_LABEL: Record<CensusSortKey, string> = {
  cedula: "Cédula",
  nombres: "Nombre",
  apellidos: "Apellido",
  titulo: "Título",
  reciente: "Recientes",
  nacimiento: "Nacimiento",
};

const GROUP_LABEL: Record<CensusGroupKey, string> = {
  condicion: "Condición",
  carrera: "Carrera",
  grado: "Grado",
  "nacimiento-mes": "Mes",
  religion: "Religión",
};

const SORT_OPTIONS = [
  { value: "", key: "cedula", label: "Cédula", hint: "Menor a mayor", icon: IdCard },
  { value: "nombres", key: "nombres", label: "Nombre", hint: "A–Z por nombre, luego apellido", icon: Type },
  { value: "apellidos", key: "apellidos", label: "Apellido", hint: "A–Z por apellido, luego nombre", icon: Signature },
  { value: "titulo", key: "titulo", label: "Título", hint: "A–Z", icon: GraduationCap },
  { value: "nacimiento", key: "nacimiento", label: "Nacimiento", hint: "Por fecha", icon: Cake },
  { value: "reciente", key: "reciente", label: "Recientes", hint: "Los más nuevos primero", icon: Clock3 },
] as const;

const GROUP_OPTIONS = [
  { value: "", key: "ninguno", label: "Sin agrupar", hint: "Un solo listado", icon: List },
  { value: "condicion", key: "condicion", label: "Condición", hint: "Soldado, sargento, sin clasificar", icon: Shield },
  { value: "carrera", key: "carrera", label: "Carrera", hint: "Por título universitario", icon: Hash },
  { value: "grado", key: "grado", label: "Grado", hint: "Postgrado, TSU, pregrado", icon: Layers },
  { value: "nacimiento-mes", key: "nacimiento-mes", label: "Mes", hint: "Enero a diciembre", icon: CalendarDays },
  { value: "religion", key: "religion", label: "Religión", hint: "Por credo", icon: Church },
] as const;

const CONDICION_OPTIONS = [
  {
    param: "",
    key: "todos",
    label: "Todos",
    hint: "Quitar el filtro de condición",
    icon: Users,
    countOf: (counts: CondicionCensusCounts) => condicionCensusTotal(counts),
  },
  {
    param: "SOLDADO_ACTIVO",
    key: "soldado",
    label: "Soldado activo",
    hint: "Ver solo soldados activos",
    icon: Shield,
    countOf: (counts: CondicionCensusCounts) => counts.soldado,
  },
  {
    param: "SARGENTO_ACTIVO",
    key: "sargento",
    label: "Sargento activo",
    hint: "Ver solo sargentos activos",
    icon: ChevronsUp,
    countOf: (counts: CondicionCensusCounts) => counts.sargento,
  },
  {
    param: "SIN",
    key: "sin",
    label: "Sin clasificar",
    hint: "Aún sin condición militar",
    icon: CircleDashed,
    countOf: (counts: CondicionCensusCounts) => counts.sin,
  },
] as const;

function SideSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-200/80 px-3 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h2 className="text-[10px] font-semibold tracking-[0.16em] text-slate-400 uppercase">{title}</h2>
        {hint ? <p className="text-[10px] text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CondicionFilter({
  value,
  counts,
  hrefFor,
  go,
}: {
  value: CondicionCensusFilter | null;
  counts: CondicionCensusCounts;
  hrefFor: (next: string) => string;
  go: (href: string, dropSelection?: boolean) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Filtrar por condición militar" className="flex flex-col gap-0.5">
      {CONDICION_OPTIONS.map((opt) => {
        const selected = opt.param === "" ? value == null : value === opt.param;
        const href = hrefFor(opt.param);
        const count = opt.countOf(counts);
        const Icon = opt.icon;
        return (
          <Link
            key={opt.key}
            href={href}
            prefetch={false}
            role="radio"
            aria-checked={selected}
            title={opt.hint}
            onClick={(event) => followWithSelection(event, href, false, go)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
              selected ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-white",
            )}
          >
            <Icon className={cn("size-3.5 shrink-0", selected ? "text-white" : "text-slate-400")} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{opt.label}</span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                selected ? "text-white" : count === 0 ? "text-slate-300" : "text-slate-900",
              )}
            >
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function followWithSelection(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
  dropSelection: boolean,
  go: (href: string, dropSelection?: boolean) => void,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    event.currentTarget.href = applySelectionParam(href, dropSelection);
    return;
  }
  event.preventDefault();
  go(href, dropSelection);
}

function SideChoice({
  href,
  label,
  hint,
  icon: Icon,
  selected,
  go,
}: {
  href: string;
  label: string;
  hint: string;
  icon: typeof IdCard;
  selected: boolean;
  go: (href: string, dropSelection?: boolean) => void;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      role="radio"
      aria-checked={selected}
      title={hint}
      onClick={(event) => followWithSelection(event, href, false, go)}
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
        selected ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/80 hover:text-slate-900",
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", selected ? "text-slate-900" : "text-slate-400")} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      <Check className={cn("size-3.5 shrink-0", selected ? "text-slate-900" : "opacity-0")} aria-hidden />
    </Link>
  );
}

function filterHref(current: FilterValues, patch: FilterValues) {
  const next: Record<string, string | undefined> = { ...current, ...patch, page: undefined };
  if (patch.convocatoria && patch.convocatoria !== current.convocatoria) {
    next.peloton = "";
  }
  const qs = censusQueryString(next, {});
  return qs ? `${routes.personal.aspirantes}?${qs}` : routes.personal.aspirantes;
}

function FacetTrigger({
  icon,
  label,
  value,
  active,
  className,
  ...props
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  active: boolean;
} & ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="sm"
      {...props}
      className={cn(
        "h-8 max-w-[16rem] gap-1.5 rounded-full border px-2.5 text-xs font-medium shadow-none",
        active
          ? "border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        className,
      )}
    >
      <span className={cn("shrink-0", active ? "text-white/80" : "text-slate-400")}>{icon}</span>
      <span className={cn("shrink-0", active ? "text-white/70" : "text-slate-500")}>{label}</span>
      <span className="min-w-0 truncate">{value ?? "Todos"}</span>
      <ChevronDown className={cn("size-3.5 shrink-0 opacity-60", active && "text-white")} aria-hidden />
    </Button>
  );
}

function OptionItem({
  href,
  selected,
  children,
  dropSelection = false,
  go,
}: {
  href: string;
  selected: boolean;
  children: ReactNode;
  dropSelection?: boolean;
  go: (href: string, dropSelection?: boolean) => void;
}) {
  return (
    <DropdownMenuItem
      nativeButton={false}
      className="gap-2 py-1.5"
      render={
        <Link
          href={href}
          prefetch={false}
          onClick={(event) => {
            followWithSelection(event, href, dropSelection, go);
          }}
        />
      }
    >
      <Check className={cn("size-3.5", selected ? "opacity-100" : "opacity-0")} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </DropdownMenuItem>
  );
}

function useCensusFilters({
  pelotones,
  convocatorias,
  defaultConvocatoriaId,
  condicionCounts,
}: Props) {
  const { go } = useCensusNavigate();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const sexo = sp.get("sexo") ?? undefined;
  const presentation = resolveCensusPresentation({
    sort: sp.get("sort") ?? undefined,
    group: sp.get("group") ?? undefined,
  });
  const paramC = sp.get("convocatoria")?.trim();
  const convocatoriaId =
    paramC && convocatorias.some((c) => c.id === paramC) ? paramC : defaultConvocatoriaId;
  const pelotonesVisibles = pelotones.filter((p) => p.convocatoriaId === convocatoriaId);
  const pelotonParam = sp.get("peloton")?.trim();
  const peloton =
    pelotonParam &&
    pelotonParam !== "TODOS" &&
    (pelotonParam === "SIN_ASIGNAR" || pelotonesVisibles.some((p) => p.id === pelotonParam))
      ? pelotonParam
      : undefined;
  const condicion = parseCondicionCensusFilter(sp.get("condicion"));
  const counts = condicionCounts[convocatoriaId] ?? EMPTY_CONDICION_COUNTS;
  const [query, setQuery] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) {
    setSyncedQ(q);
    setQuery(q);
  }

  const current: FilterValues = {
    q: q || undefined,
    sexo,
    sort: presentation.sort === "cedula" ? undefined : presentation.sort,
    group: presentation.group ?? undefined,
    peloton,
    convocatoria: convocatoriaId,
    condicion: condicion ?? undefined,
  };

  const href = (patch: FilterValues) => filterHref(current, patch);

  const sexoActivo = sexo === "MASCULINO" || sexo === "FEMENINO";
  const pelotonActivo = Boolean(peloton?.trim() && peloton !== "TODOS");
  const convocatoriaActiva = Boolean(
    convocatoriaId && defaultConvocatoriaId && convocatoriaId !== defaultConvocatoriaId,
  );

  const convocatoriaActual = convocatorias.find((c) => c.id === convocatoriaId);
  const pelotonActual =
    peloton === "SIN_ASIGNAR"
      ? "Sin asignar"
      : pelotonesVisibles.find((p) => p.id === peloton)
        ? labelPeloton(pelotonesVisibles.find((p) => p.id === peloton)!)
        : undefined;

  const chips: { key: string; label: string; href: string; dropSelection?: boolean }[] = [];
  if (q.trim()) chips.push({ key: "q", label: `Buscar: ${q.trim()}`, href: href({ q: "" }) });
  if (convocatoriaActiva && convocatoriaActual) {
    chips.push({
      key: "convocatoria",
      label: `Convocatoria: ${convocatoriaActual.codigo}`,
      href: href({ convocatoria: defaultConvocatoriaId, peloton: "" }),
      dropSelection: true,
    });
  }
  if (pelotonActivo && pelotonActual) {
    chips.push({ key: "peloton", label: `Pelotón: ${pelotonActual}`, href: href({ peloton: "TODOS" }) });
  }
  if (sexoActivo && sexo) {
    chips.push({ key: "sexo", label: `Sexo: ${sexoEtiqueta(sexo)}`, href: href({ sexo: "TODOS" }) });
  }
  if (presentation.sort !== "cedula") {
    chips.push({
      key: "sort",
      label: `Orden: ${SORT_LABEL[presentation.sort]}`,
      href: href({ sort: "" }),
    });
  }
  if (presentation.group) {
    chips.push({
      key: "group",
      label: `Agrupar: ${GROUP_LABEL[presentation.group]}`,
      href: href({ group: "" }),
    });
  }
  if (condicion) {
    chips.push({
      key: "condicion",
      label: `Condición: ${labelCondicionCensusFilter(condicion)}`,
      href: href({ condicion: "" }),
    });
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    go(href({ q: query.trim() }));
  }

  const resetHref = routes.personal.aspirantes;
  const summary = [
    condicion ? labelCondicionCensusFilter(condicion) : "Todos",
    SORT_LABEL[presentation.sort],
    presentation.group ? GROUP_LABEL[presentation.group] : "Sin agrupar",
  ].join(" · ");

  return {
    go,
    href,
    query,
    setQuery,
    onSearch,
    condicion,
    counts,
    presentation,
    chips,
    resetHref,
    summary,
    sexo,
    sexoActivo,
    peloton,
    pelotonActivo,
    pelotonActual,
    pelotonesVisibles,
    convocatorias,
    convocatoriaId,
    convocatoriaActual,
    convocatoriaActiva,
  };
}

export function AspirantesCensusSearch(props: Props) {
  const { go, href, query, setQuery, onSearch } = useCensusFilters(props);

  return (
    <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Label htmlFor="q" className="sr-only">
          Buscar por nombre, apellido o cédula
        </Label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          id="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nombre, apellido o cédula…"
          className="h-10 border-slate-200 bg-white pr-9 pl-9 shadow-sm"
        />
        {query ? (
          <button
            type="button"
            className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setQuery("");
              go(href({ q: "" }));
            }}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      <Button type="submit" className="h-10 flex-1 gap-2 bg-slate-900 px-4 hover:bg-slate-800 sm:flex-initial">
        <Search className="size-4" aria-hidden />
        Buscar
      </Button>
    </form>
  );
}

export function AspirantesFilterBar(props: Props) {
  const filters = useCensusFilters(props);
  const {
    go,
    href,
    condicion,
    counts,
    presentation,
    chips,
    resetHref,
    summary,
    sexo,
    sexoActivo,
    peloton,
    pelotonActivo,
    pelotonActual,
    pelotonesVisibles,
    convocatorias,
    convocatoriaId,
    convocatoriaActual,
    convocatoriaActiva,
  } = filters;
  const [open, setOpen] = useState(false);

  function goFromSidebar(next: string, dropSelection?: boolean) {
    setOpen(false);
    go(next, dropSelection);
  }

  return (
    <aside className="border-b border-slate-200/90 bg-slate-50/80 lg:border-r lg:border-b-0">
      <div className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto scrollbar-thin">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-3 text-left lg:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <PanelLeft className="size-4 shrink-0 text-slate-500" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-900">Organizar listado</span>
            <span className="block truncate text-xs text-slate-500">{summary}</span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
        </button>

        <div className={cn(open ? "block" : "hidden", "lg:block")}>
          <SideSection title="Condición militar" hint="Totales">
            <CondicionFilter
              value={condicion}
              counts={counts}
              hrefFor={(next) => href({ condicion: next })}
              go={goFromSidebar}
            />
          </SideSection>

          <SideSection title="Ordenar">
            <div role="radiogroup" aria-label="Orden del listado" className="flex flex-col gap-0.5">
              {SORT_OPTIONS.map((opt) => (
                <SideChoice
                  key={opt.key}
                  href={href({ sort: opt.value })}
                  label={opt.label}
                  hint={opt.hint}
                  icon={opt.icon}
                  selected={presentation.sort === opt.key}
                  go={goFromSidebar}
                />
              ))}
            </div>
          </SideSection>

          <SideSection title="Agrupar">
            <div role="radiogroup" aria-label="Agrupación del listado" className="flex flex-col gap-0.5">
              {GROUP_OPTIONS.map((opt) => (
                <SideChoice
                  key={opt.key}
                  href={href({ group: opt.value })}
                  label={opt.label}
                  hint={opt.hint}
                  icon={opt.icon}
                  selected={opt.value === "" ? presentation.group == null : presentation.group === opt.value}
                  go={goFromSidebar}
                />
              ))}
            </div>
          </SideSection>

          <SideSection title="Filtrar">
            <div className="flex flex-col gap-1.5">
        {convocatorias.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <FacetTrigger
                  icon={<BookMarked className="size-3.5" aria-hidden />}
                  label="Convocatoria"
                  value={convocatoriaActual ? convocatoriaActual.codigo : undefined}
                  active={convocatoriaActiva}
                  className="h-9 w-full max-w-none justify-between rounded-lg"
                />
              }
            />
            <DropdownMenuContent align="start" className="min-w-64">
              <DropdownMenuGroup>
                {convocatorias.map((c) => (
                  <OptionItem go={goFromSidebar}
                    key={c.id}
                    href={href({ convocatoria: c.id, peloton: "" })}
                    selected={c.id === convocatoriaId}
                    dropSelection={c.id !== convocatoriaId}
                  >
                    {c.codigo}
                    {c.activa ? " · activa" : ""} — {c.nombre}
                  </OptionItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <FacetTrigger
                icon={<Shield className="size-3.5" aria-hidden />}
                label="Pelotón"
                value={pelotonActivo ? pelotonActual : undefined}
                active={pelotonActivo}
                className="h-9 w-full max-w-none justify-between rounded-lg"
              />
            }
          />
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuGroup>
              <OptionItem go={goFromSidebar} href={href({ peloton: "TODOS" })} selected={!pelotonActivo}>
                Todos
              </OptionItem>
              <OptionItem go={goFromSidebar} href={href({ peloton: "SIN_ASIGNAR" })} selected={peloton === "SIN_ASIGNAR"}>
                Sin asignar
              </OptionItem>
              {pelotonesVisibles.map((p) => (
                <OptionItem go={goFromSidebar} key={p.id} href={href({ peloton: p.id })} selected={peloton === p.id}>
                  {labelPeloton(p)}
                </OptionItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <FacetTrigger
                icon={<Users className="size-3.5" aria-hidden />}
                label="Sexo"
                value={sexoActivo && sexo ? sexoEtiqueta(sexo) : undefined}
                active={sexoActivo}
                className="h-9 w-full max-w-none justify-between rounded-lg"
              />
            }
          />
          <DropdownMenuContent align="start" className="min-w-40">
            <DropdownMenuGroup>
              <OptionItem go={goFromSidebar} href={href({ sexo: "TODOS" })} selected={!sexoActivo}>
                Todos
              </OptionItem>
              <OptionItem go={goFromSidebar} href={href({ sexo: "MASCULINO" })} selected={sexo === "MASCULINO"}>
                Masculino
              </OptionItem>
              <OptionItem go={goFromSidebar} href={href({ sexo: "FEMENINO" })} selected={sexo === "FEMENINO"}>
                Femenino
              </OptionItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
            </div>
          </SideSection>

          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-3">
              {chips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  prefetch={false}
                  onClick={(event) =>
                    followWithSelection(event, chip.href, Boolean(chip.dropSelection), goFromSidebar)
                  }
                  className="inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white pl-2.5 pr-1 text-xs text-slate-800 hover:border-slate-300"
                >
                  <span className="min-w-0 truncate">{chip.label}</span>
                  <span className="flex size-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-800">
                    <X className="size-3" aria-hidden />
                  </span>
                </Link>
              ))}
              <Link
                href={resetHref}
                prefetch={false}
                onClick={(event) => followWithSelection(event, resetHref, convocatoriaActiva, goFromSidebar)}
                className="inline-flex h-7 items-center rounded-full px-2 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Restablecer
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
