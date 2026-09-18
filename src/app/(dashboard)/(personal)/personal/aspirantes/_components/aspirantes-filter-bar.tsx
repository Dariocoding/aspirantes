"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BookMarked,
  Cake,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  GraduationCap,
  Hash,
  IdCard,
  Layers,
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
import { censusQueryString, sexoEtiqueta } from "@src/lib/aspirantes/census";
import { routes } from "@src/lib/apps/routes";
import { labelPeloton, type PelotonResumen } from "@src/lib/pelotones";
import { cn } from "@src/lib/utils";

type ConvocatoriaOption = { id: string; codigo: string; nombre: string; activa: boolean };

type FilterValues = {
  q?: string;
  sexo?: string;
  sort?: string;
  peloton?: string;
  convocatoria?: string;
};

type Props = {
  q: string;
  sexo: string | undefined;
  sort: string | undefined;
  peloton: string | undefined;
  pelotones: PelotonResumen[];
  convocatorias: ConvocatoriaOption[];
  convocatoriaId: string | undefined;
  defaultConvocatoriaId: string | undefined;
};

const SORT_LABEL: Record<string, string> = {
  cedula: "Cédula",
  nombres: "Nombre A–Z",
  apellidos: "Apellido A–Z",
  titulo: "Título A–Z",
  reciente: "Más recientes",
  nacimiento: "Nacimiento",
  "nacimiento-mes": "Mes de nacimiento",
  carrera: "Por carrera",
  grado: "Por grado",
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
  { value: "carrera", key: "carrera", label: "Carrera", hint: "Agrupa por título universitario", icon: Hash },
  { value: "grado", key: "grado", label: "Grado", hint: "Nivel educativo", icon: Layers },
  { value: "nacimiento-mes", key: "nacimiento-mes", label: "Mes", hint: "Ene → Dic", icon: CalendarDays },
] as const;

const ACTIVE_SORTS = new Set([
  "nombres",
  "apellidos",
  "titulo",
  "carrera",
  "grado",
  "nacimiento",
  "nacimiento-mes",
  "reciente",
]);

function isActiveSort(sort: string | undefined) {
  return Boolean(sort && sort !== "cedula" && ACTIVE_SORTS.has(sort));
}

function sortKeyOf(sort: string | undefined) {
  if (!isActiveSort(sort)) return "cedula";
  return sort as string;
}

function SortRail({
  sort,
  hrefFor,
}: {
  sort: string | undefined;
  hrefFor: (sortValue: string) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0, ready: false });
  const activeKey = pendingKey ?? sortKeyOf(sort);

  useEffect(() => {
    setPendingKey(null);
  }, [sort]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const place = () => {
      const chip = scroller.querySelector<HTMLElement>(`[data-sort-key="${activeKey}"]`);
      if (!chip) return;
      setIndicator({
        x: chip.offsetLeft,
        w: chip.offsetWidth,
        ready: true,
      });
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(scroller);
    for (const el of scroller.querySelectorAll("[data-sort-key]")) {
      ro.observe(el);
    }
    return () => ro.disconnect();
  }, [activeKey]);

  useEffect(() => {
    if (!pendingKey) return;
    const scroller = scrollerRef.current;
    const chip = scroller?.querySelector<HTMLElement>(`[data-sort-key="${pendingKey}"]`);
    chip?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [pendingKey]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-1 shadow-sm shadow-slate-900/4">
      <div className="overflow-x-auto scrollbar-thin">
        <div
          ref={scrollerRef}
          className="relative flex min-w-max items-center gap-1 px-0.5 py-0.5"
          role="radiogroup"
          aria-label="Orden y agrupación del censo"
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-0.5 bottom-0.5 rounded-full bg-slate-900 shadow-[0_1px_8px_-2px_rgb(15_23_42/0.55)]",
              indicator.ready
                ? "transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                : "opacity-0",
            )}
            style={{ width: indicator.w, transform: `translateX(${indicator.x}px)` }}
          />

          <span className="z-10 shrink-0 px-2 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Orden
          </span>
          {SORT_OPTIONS.map((opt) => (
            <SortChip
              key={opt.key}
              href={hrefFor(opt.value)}
              option={opt}
              selected={activeKey === opt.key}
              onPick={() => setPendingKey(opt.key)}
            />
          ))}

          <span className="mx-1 h-6 w-px shrink-0 bg-slate-200" aria-hidden />

          <span className="z-10 shrink-0 px-2 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Agrupar
          </span>
          {GROUP_OPTIONS.map((opt) => (
            <SortChip
              key={opt.key}
              href={hrefFor(opt.value)}
              option={opt}
              selected={activeKey === opt.key}
              onPick={() => setPendingKey(opt.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SortChip({
  href,
  option,
  selected,
  onPick,
}: {
  href: string;
  option: {
    key: string;
    label: string;
    hint: string;
    icon: typeof IdCard;
  };
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = option.icon;
  return (
    <Link
      href={href}
      prefetch={false}
      data-sort-key={option.key}
      role="radio"
      aria-checked={selected}
      title={option.hint}
      onClick={onPick}
      className={cn(
        "relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors duration-200",
        selected ? "text-white" : "text-slate-600 hover:text-slate-900",
      )}
    >
      <Icon
        className={cn(
          "size-3.5 transition-transform duration-300",
          selected ? "scale-110 text-white" : "text-slate-400",
        )}
        aria-hidden
      />
      <span>{option.label}</span>
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
}: {
  href: string;
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <DropdownMenuItem
      nativeButton={false}
      className="gap-2 py-1.5"
      render={<Link href={href} prefetch={false} />}
    >
      <Check className={cn("size-3.5", selected ? "opacity-100" : "opacity-0")} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </DropdownMenuItem>
  );
}

export function AspirantesFilterBar({
  q,
  sexo,
  sort,
  peloton,
  pelotones,
  convocatorias,
  convocatoriaId,
  defaultConvocatoriaId,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const current: FilterValues = {
    q: q || undefined,
    sexo,
    sort: isActiveSort(sort) ? sort : undefined,
    peloton,
    convocatoria: convocatoriaId,
  };

  const href = (patch: FilterValues) => filterHref(current, patch);

  const sexoActivo = sexo === "MASCULINO" || sexo === "FEMENINO";
  const pelotonActivo = Boolean(peloton?.trim() && peloton !== "TODOS");
  const sortActivo = isActiveSort(sort);
  const convocatoriaActiva = Boolean(
    convocatoriaId && defaultConvocatoriaId && convocatoriaId !== defaultConvocatoriaId,
  );

  const convocatoriaActual = convocatorias.find((c) => c.id === convocatoriaId);
  const pelotonActual =
    peloton === "SIN_ASIGNAR"
      ? "Sin asignar"
      : pelotones.find((p) => p.id === peloton)
        ? labelPeloton(pelotones.find((p) => p.id === peloton)!)
        : undefined;

  const chips: { key: string; label: string; href: string }[] = [];
  if (q.trim()) chips.push({ key: "q", label: `Buscar: ${q.trim()}`, href: href({ q: "" }) });
  if (convocatoriaActiva && convocatoriaActual) {
    chips.push({
      key: "convocatoria",
      label: `Convocatoria: ${convocatoriaActual.codigo}`,
      href: href({ convocatoria: defaultConvocatoriaId, peloton: "" }),
    });
  }
  if (pelotonActivo && pelotonActual) {
    chips.push({ key: "peloton", label: `Pelotón: ${pelotonActual}`, href: href({ peloton: "TODOS" }) });
  }
  if (sexoActivo && sexo) {
    chips.push({ key: "sexo", label: `Sexo: ${sexoEtiqueta(sexo)}`, href: href({ sexo: "TODOS" }) });
  }
  if (sortActivo && sort) {
    chips.push({
      key: "sort",
      label: `Orden: ${SORT_LABEL[sort] ?? sort}`,
      href: href({ sort: "" }),
    });
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(href({ q: query.trim() }));
  }

  const resetHref = routes.personal.aspirantes;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Label htmlFor="q" className="sr-only">
            Buscar por nombre, apellido o cédula
          </Label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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
              className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Borrar búsqueda"
              onClick={() => {
                setQuery("");
                router.push(href({ q: "" }));
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

      <SortRail sort={sort} hrefFor={(value) => href({ sort: value })} />

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 scrollbar-thin">
        {convocatorias.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <FacetTrigger
                  icon={<BookMarked className="size-3.5" aria-hidden />}
                  label="Convocatoria"
                  value={convocatoriaActual ? convocatoriaActual.codigo : undefined}
                  active={convocatoriaActiva}
                />
              }
            />
            <DropdownMenuContent align="start" className="min-w-64">
              <DropdownMenuGroup>
                {convocatorias.map((c) => (
                  <OptionItem
                    key={c.id}
                    href={href({ convocatoria: c.id, peloton: "" })}
                    selected={c.id === convocatoriaId}
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
              />
            }
          />
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuGroup>
              <OptionItem href={href({ peloton: "TODOS" })} selected={!pelotonActivo}>
                Todos
              </OptionItem>
              <OptionItem href={href({ peloton: "SIN_ASIGNAR" })} selected={peloton === "SIN_ASIGNAR"}>
                Sin asignar
              </OptionItem>
              {pelotones.map((p) => (
                <OptionItem key={p.id} href={href({ peloton: p.id })} selected={peloton === p.id}>
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
              />
            }
          />
          <DropdownMenuContent align="start" className="min-w-40">
            <DropdownMenuGroup>
              <OptionItem href={href({ sexo: "TODOS" })} selected={!sexoActivo}>
                Todos
              </OptionItem>
              <OptionItem href={href({ sexo: "MASCULINO" })} selected={sexo === "MASCULINO"}>
                Masculino
              </OptionItem>
              <OptionItem href={href({ sexo: "FEMENINO" })} selected={sexo === "FEMENINO"}>
                Femenino
              </OptionItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              prefetch={false}
              className="inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 pl-2.5 pr-1 text-xs text-slate-800 hover:border-slate-300 hover:bg-white"
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
            className="inline-flex h-7 items-center rounded-full px-2 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            Restablecer
          </Link>
        </div>
      ) : null}
    </div>
  );
}
