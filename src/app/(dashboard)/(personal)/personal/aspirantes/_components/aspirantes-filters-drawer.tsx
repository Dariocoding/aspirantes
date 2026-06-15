"use client";

import Link from "next/link";
import { ArrowDownWideNarrow, BookMarked, Landmark, SlidersHorizontal, Users } from "lucide-react";
import { Button, buttonVariants } from "@src/components/ui/button";
import { cn } from "@src/lib/utils";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@src/components/ui/sheet";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ConvocatoriaOption = { id: string; codigo: string; nombre: string; activa: boolean };

type Props = {
  q: string;
  sexo: string | undefined;
  edadMin: string | undefined;
  edadMax: string | undefined;
  sort: string | undefined;
  calificacion: string | undefined;
  unidadPostulante: string | undefined;
  unidadesPostulantes: string[];
  convocatorias: ConvocatoriaOption[];
  convocatoriaId: string | undefined;
  clearAdvancedHref: string;
  activeAdvancedCount: number;
};

export function AspirantesFiltersDrawer({
  q,
  sexo,
  edadMin,
  edadMax,
  sort,
  calificacion,
  unidadPostulante,
  unidadesPostulantes,
  convocatorias,
  convocatoriaId,
  clearAdvancedHref,
  activeAdvancedCount,
}: Props) {
  return (
    <Sheet>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 gap-2 border-slate-200 bg-white shadow-sm",
        )}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filtros avanzados
        {activeAdvancedCount > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold text-white tabular-nums">
            {activeAdvancedCount}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 text-left">
          <SheetTitle>Criterios avanzados</SheetTitle>
          <SheetDescription>
            Convocatoria, unidad postulante, admisión, sexo, rango de edad y orden del listado. La búsqueda por texto
            permanece en la barra superior.
          </SheetDescription>
        </SheetHeader>
        <form method="get" className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="page" value="1" />
          <div className="flex flex-col gap-5 overflow-y-auto p-4">
            {convocatorias.length ? (
              <div>
                <Label htmlFor="drawer-convocatoria" className="mb-2 flex items-center gap-2 text-slate-700">
                  <BookMarked className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                  Convocatoria
                </Label>
                <select
                  id="drawer-convocatoria"
                  name="convocatoria"
                  defaultValue={convocatoriaId ?? ""}
                  className={selectClass}
                >
                  {convocatorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo}
                      {c.activa ? " (activa)" : ""} — {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <Label htmlFor="drawer-unidad" className="mb-2 flex items-center gap-2 text-slate-700">
                <Landmark className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                Unidad postulante
              </Label>
              <select
                id="drawer-unidad"
                name="unidadPostulante"
                defaultValue={
                  unidadPostulante?.trim() && unidadPostulante.trim() !== "TODOS"
                    ? unidadPostulante.trim()
                    : "TODOS"
                }
                className={selectClass}
              >
                <option value="TODOS">Todas</option>
                {unidadesPostulantes.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {unidadesPostulantes.length === 0 ? (
                <p className="mt-1.5 text-xs text-slate-500">No hay unidades registradas en esta convocatoria.</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="drawer-calificacion" className="mb-2 text-slate-700">
                Calificación de admisión
              </Label>
              <select
                id="drawer-calificacion"
                name="calificacion"
                defaultValue={calificacion ?? "TODOS"}
                className={selectClass}
              >
                <option value="TODOS">Todas</option>
                <option value="APTO">Apto</option>
                <option value="NO_APTO">No apto</option>
                <option value="EN_EVALUACION">En evaluación</option>
              </select>
            </div>
            <div>
              <Label htmlFor="drawer-sexo" className="mb-2 flex items-center gap-2 text-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                Sexo
              </Label>
              <select id="drawer-sexo" name="sexo" defaultValue={sexo ?? "TODOS"} className={selectClass}>
                <option value="TODOS">Todos</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="drawer-edadMin" className="mb-2 text-slate-700">
                  Edad mínima
                </Label>
                <Input
                  id="drawer-edadMin"
                  name="edadMin"
                  type="number"
                  min={0}
                  defaultValue={edadMin ?? ""}
                  placeholder="—"
                  className="h-10 border-slate-200"
                />
              </div>
              <div>
                <Label htmlFor="drawer-edadMax" className="mb-2 text-slate-700">
                  Edad máxima
                </Label>
                <Input
                  id="drawer-edadMax"
                  name="edadMax"
                  type="number"
                  min={0}
                  defaultValue={edadMax ?? ""}
                  placeholder="—"
                  className="h-10 border-slate-200"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="drawer-sort" className="mb-2 flex items-center gap-2 text-slate-700">
                <ArrowDownWideNarrow className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                Orden del listado
              </Label>
              <select id="drawer-sort" name="sort" defaultValue={sort ?? "reciente"} className={selectClass}>
                      <option value="reciente">Más recientes</option>
                <option value="nombres">Nombre (A-Z)</option>
              </select>
            </div>
          </div>
          <SheetFooter className="mt-auto shrink-0 border-t border-border bg-muted/30">
            <Button type="submit" className="w-full gap-2 bg-slate-900 hover:bg-slate-800 sm:w-auto">
              Aplicar criterios
            </Button>
            <Link
              href={clearAdvancedHref}
              prefetch={false}
              className={cn(buttonVariants({ variant: "outline" }), "w-full border-slate-200 bg-background sm:w-auto")}
            >
              Quitar filtros avanzados
            </Link>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
