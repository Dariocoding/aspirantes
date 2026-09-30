"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Trash2 } from "lucide-react";
import { AspiranteQuickRegisterButton } from "@dashboard/aspirantes/_components/aspirante-quick-dialog";
import { AspirantesExportLinks } from "@dashboard/aspirantes/_components/aspirantes-export-links";
import { AspirantesFilterBar } from "@dashboard/aspirantes/_components/aspirantes-filter-bar";
import { buttonVariants } from "@src/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { censusQueryString } from "@src/lib/aspirantes/census";
import {
  parseCondicionCensusFilter,
  type CondicionCensusCounts,
} from "@src/lib/aspirantes/condicion-militar";
import { routes } from "@src/lib/apps/routes";
import type { MembreteOption } from "@src/lib/membrete";
import type { PelotonResumen } from "@src/lib/pelotones";
import { cn } from "@src/lib/utils";

type ConvocatoriaOption = {
  id: string;
  codigo: string;
  nombre: string;
  anio: number;
  activa: boolean;
};

type PelotonOption = PelotonResumen & { convocatoriaId: string };

function useConvocatoriaId(convocatorias: ConvocatoriaOption[], defaultConvocatoriaId: string) {
  const param = useSearchParams().get("convocatoria")?.trim();
  if (param && convocatorias.some((c) => c.id === param)) return param;
  return defaultConvocatoriaId;
}

export function ConvocatoriaLine({
  convocatorias,
  defaultConvocatoriaId,
}: {
  convocatorias: ConvocatoriaOption[];
  defaultConvocatoriaId: string;
}) {
  const convocatoriaId = useConvocatoriaId(convocatorias, defaultConvocatoriaId);
  const actual = convocatorias.find((c) => c.id === convocatoriaId) ?? convocatorias[0];
  if (!actual) return null;
  return (
    <p className="min-w-0 pl-7 text-sm text-slate-600">
      Convocatoria:{" "}
      <strong className="font-bold text-slate-900">
        {actual.nombre}
        {" · "}
        {actual.anio}
      </strong>
    </p>
  );
}

function PapeleraLink({ count }: { count: number }) {
  return (
    <Link
      href={routes.personal.papelera}
      prefetch={false}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-9 gap-1.5 border-slate-200 bg-white shadow-sm",
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      Papelera
      {count > 0 ? (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold tabular-nums text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function CensusToolbar({
  write,
  convocatorias,
  defaultConvocatoriaId,
  pelotones,
  papeleraCount,
  membretes,
  counts,
}: {
  write: boolean;
  convocatorias: ConvocatoriaOption[];
  defaultConvocatoriaId: string;
  pelotones: PelotonOption[];
  papeleraCount: number;
  membretes: MembreteOption[];
  counts: Record<string, number>;
}) {
  const sp = useSearchParams();
  const convocatoriaId = useConvocatoriaId(convocatorias, defaultConvocatoriaId);
  const pelotonesVisibles = pelotones.filter((p) => p.convocatoriaId === convocatoriaId);
  const peloton = sp.get("peloton")?.trim();
  const pelotonActivo = Boolean(
    peloton &&
      peloton !== "TODOS" &&
      (peloton === "SIN_ASIGNAR" || pelotonesVisibles.some((p) => p.id === peloton)),
  );
  const condicion = parseCondicionCensusFilter(sp.get("condicion"));
  const exportQuery = censusQueryString(
    {
      q: sp.get("q") ?? undefined,
      sexo: sp.get("sexo") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      peloton: pelotonActivo ? peloton : undefined,
      convocatoria: convocatoriaId,
      condicion: condicion ?? undefined,
    },
    {},
  );

  return (
    <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold text-slate-900">Directorio del censo</CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Listado paginado e identificación básica.
            {write
              ? " Excel permite elegir columnas, exportar e importar por cédula; PDF exporta censo, fichas, boletas de permiso y constancias de estudios."
              : " La exportación masiva (Excel/PDF) está reservada a operadores y administradores."}
          </CardDescription>
        </div>
        {write ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
            <PapeleraLink count={papeleraCount} />
            <AspirantesExportLinks
              exportQuery={exportQuery}
              convocatoriaId={convocatoriaId}
              convocatoriaCount={counts[convocatoriaId] ?? 0}
              membretes={membretes}
            />
            <AspiranteQuickRegisterButton pelotones={pelotonesVisibles} />
          </div>
        ) : null}
      </div>
    </CardHeader>
  );
}

export function CensusFilters({
  convocatorias,
  defaultConvocatoriaId,
  pelotones,
  condicionCounts,
}: {
  convocatorias: ConvocatoriaOption[];
  defaultConvocatoriaId: string;
  pelotones: PelotonOption[];
  condicionCounts: Record<string, CondicionCensusCounts>;
}) {
  return (
    <div className="border-b border-slate-200/90 bg-slate-50/60 px-4 py-3">
      <AspirantesFilterBar
        pelotones={pelotones}
        convocatorias={convocatorias}
        defaultConvocatoriaId={defaultConvocatoriaId}
        condicionCounts={condicionCounts}
      />
    </div>
  );
}

export function CensusTitle() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ClipboardList className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
      <h1 className="min-w-0 text-xl font-semibold tracking-tight text-slate-900">Censo de aspirantes</h1>
    </div>
  );
}
