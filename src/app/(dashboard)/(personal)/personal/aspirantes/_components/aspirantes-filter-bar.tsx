"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownWideNarrow,
  BookMarked,
  Check,
  ChevronDown,
  Search,
  Shield,
  Users,
  X,
} from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  titulo: "Título A–Z",
  reciente: "Más recientes",
  nacimiento: "Nacimiento",
  "nacimiento-mes": "Mes de nacimiento",
  carrera: "Por carrera",
  grado: "Por grado",
};

function isActiveSort(sort: string | undefined) {
  return Boolean(
    sort &&
      sort !== "cedula" &&
      (sort === "nombres" ||
        sort === "titulo" ||
        sort === "carrera" ||
        sort === "grado" ||
        sort === "nacimiento" ||
        sort === "nacimiento-mes" ||
        sort === "reciente"),
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
        <div className="flex gap-2">
          <Button type="submit" className="h-10 flex-1 gap-2 bg-slate-900 px-4 hover:bg-slate-800 sm:flex-initial">
            <Search className="size-4" aria-hidden />
            Buscar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 gap-1.5 border-slate-200 bg-white px-3 shadow-sm",
                    sortActivo && "border-slate-800 bg-slate-900 text-white hover:bg-slate-800 hover:text-white",
                  )}
                />
              }
            >
              <ArrowDownWideNarrow aria-hidden />
              {SORT_LABEL[sort ?? "cedula"] ?? "Cédula"}
              <ChevronDown className="opacity-60" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuGroup>
                <DropdownMenuGroupLabel>Ordenar</DropdownMenuGroupLabel>
                <OptionItem href={href({ sort: "" })} selected={!sortActivo}>
                  Cédula (menor a mayor)
                </OptionItem>
                <OptionItem href={href({ sort: "nombres" })} selected={sort === "nombres"}>
                  Nombre (A–Z)
                </OptionItem>
                <OptionItem href={href({ sort: "titulo" })} selected={sort === "titulo"}>
                  Título universitario (A–Z)
                </OptionItem>
                <OptionItem href={href({ sort: "nacimiento" })} selected={sort === "nacimiento"}>
                  Fecha de nacimiento
                </OptionItem>
                <OptionItem href={href({ sort: "reciente" })} selected={sort === "reciente"}>
                  Más recientes
                </OptionItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuGroupLabel>Agrupar</DropdownMenuGroupLabel>
                <OptionItem href={href({ sort: "carrera" })} selected={sort === "carrera"}>
                  Por carrera
                </OptionItem>
                <OptionItem href={href({ sort: "grado" })} selected={sort === "grado"}>
                  Por grado educativo
                </OptionItem>
                <OptionItem href={href({ sort: "nacimiento-mes" })} selected={sort === "nacimiento-mes"}>
                  Por mes de nacimiento
                </OptionItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </form>

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
