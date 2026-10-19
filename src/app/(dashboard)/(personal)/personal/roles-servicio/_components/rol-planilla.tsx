"use client";

import { useState, useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  actualizarMarcasAsignacion,
  actualizarMarcasLote,
} from "@src/app/actions/roles-servicio-marcas";
import { contarDsFs } from "@src/lib/roles-servicio/generar-rotacion";
import {
  esColumnaAmarilla,
  letraSemana,
  type MarcaDia,
} from "@src/lib/roles-servicio/marcas";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";
import { cn } from "@src/lib/utils";
import { GenerarCalendarioDialog } from "./generar-calendario-dialog";
import type { AsignacionVista, PlanVista } from "./types";

type Fila = {
  plan: PlanVista;
  asignacion: AsignacionVista;
};

type Props = {
  filas: Fila[];
  dias: number[];
  anio: number;
  mes: number;
  diaHoy: number | null;
  diaSeleccionado: number;
  todosLosRoles: boolean;
  canWrite: boolean;
  /** Todos los planes del mes (para el generador multi-rol). */
  planes: PlanVista[];
  /** Rol activo, si hay uno; preselección en el dialog. */
  planUnico: PlanVista | null;
  onSelectDia: (dia: number) => void;
  onMarcasChange: (
    cambios: Array<{ asignacionId: string; dias: MarcaDia[] }>,
  ) => void;
};

function marcaDelDia(asignacion: AsignacionVista, dia: number): string | null {
  return asignacion.dias.find((item) => item.dia === dia)?.marca ?? null;
}

function nombreFila(asignacion: AsignacionVista): string {
  if (asignacion.aspirante) {
    return `${asignacion.aspirante.nombres} ${asignacion.aspirante.apellidos}`.toUpperCase();
  }
  if (asignacion.autoridad) {
    return `${asignacion.autoridad.nombres} ${asignacion.autoridad.apellidos}`.toUpperCase();
  }
  return (asignacion.nombre.trim() || "—").toUpperCase();
}

export function RolPlanilla({
  filas,
  dias,
  anio,
  mes,
  diaHoy,
  diaSeleccionado,
  todosLosRoles,
  canWrite,
  planes,
  planUnico,
  onSelectDia,
  onMarcasChange,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [generarOpen, setGenerarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCelda = (asignacion: AsignacionVista, dia: number) => {
    if (!canWrite || pending) return;
    const actual = marcaDelDia(asignacion, dia);
    const next: MarcaDia[] = actual
      ? asignacion.dias.filter((item) => item.dia !== dia)
      : [...asignacion.dias, { dia, marca: "X" }].sort((a, b) => a.dia - b.dia);

    onMarcasChange([{ asignacionId: asignacion.id, dias: next }]);
    startTransition(async () => {
      const result = await actualizarMarcasAsignacion(asignacion.id, next);
      if (!result.ok) setError(result.message);
      else setError(null);
    });
  };

  const hayPersonal = planes.some((p) => p.asignaciones.length > 0);

  return (
    <div className="flex flex-col gap-2">
      {canWrite ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-3">
          <p className="text-[11px] text-slate-500">
            {todosLosRoles
              ? "Elija roles y genere el calendario (nadie con dos servicios el mismo día)."
              : "Clic en una celda para poner o quitar X. Genere el calendario multi-rol con máximo espacio."}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setGenerarOpen(true)}
            disabled={pending || !hayPersonal}
          >
            <Wand2 className="size-3.5" aria-hidden />
            Generar calendario
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="px-3 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-max border-collapse text-[11px] text-slate-900">
          <thead>
            <tr>
              {todosLosRoles ? (
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 border border-slate-400 bg-slate-100 px-2 py-1 text-left font-bold uppercase"
                >
                  Rol
                </th>
              ) : null}
              <th
                rowSpan={2}
                className={cn(
                  "sticky z-30 border border-slate-400 bg-slate-100 px-1.5 py-1 font-bold",
                  todosLosRoles ? "left-[7.5rem]" : "left-0",
                )}
              >
                №
              </th>
              <th
                rowSpan={2}
                className={cn(
                  "sticky z-30 border border-slate-400 bg-slate-100 px-2 py-1 text-left font-bold uppercase",
                  todosLosRoles ? "left-[9.25rem]" : "left-[1.75rem]",
                )}
              >
                Grado / Jquia
              </th>
              <th
                rowSpan={2}
                className={cn(
                  "sticky z-30 min-w-48 border border-slate-400 bg-slate-100 px-2 py-1 text-left font-bold uppercase",
                  todosLosRoles ? "left-[15.5rem]" : "left-[7.5rem]",
                )}
              >
                Nombres y apellidos
              </th>
              {dias.map((dia) => {
                const amarilla = esColumnaAmarilla(anio, mes, dia);
                return (
                  <th
                    key={`l-${dia}`}
                    className={cn(
                      "min-w-7 w-7 border border-slate-400 px-0 py-0.5 text-center font-bold",
                      amarilla ? "bg-amber-300" : "bg-white",
                      dia === diaHoy && "ring-2 ring-inset ring-sky-500",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => onSelectDia(dia)}
                      title={`Día ${dia}`}
                    >
                      {letraSemana(anio, mes, dia)}
                    </button>
                  </th>
                );
              })}
              {(["D/S", "F/S", "TOTAL", "FIRMA"] as const).map((label) => (
                <th
                  key={label}
                  rowSpan={2}
                  className="min-w-10 border border-slate-400 bg-sky-200 px-1.5 py-1 font-bold uppercase"
                >
                  {label}
                </th>
              ))}
            </tr>
            <tr>
              {dias.map((dia) => {
                const amarilla = esColumnaAmarilla(anio, mes, dia);
                const sel = dia === diaSeleccionado;
                return (
                  <th
                    key={`n-${dia}`}
                    className={cn(
                      "min-w-7 w-7 border border-slate-400 px-0 py-0.5 text-center font-bold tabular-nums",
                      amarilla ? "bg-amber-300" : "bg-white",
                      sel && "bg-teal-100",
                      dia === diaHoy && "ring-2 ring-inset ring-sky-500",
                    )}
                  >
                    <button type="button" className="w-full" onClick={() => onSelectDia(dia)}>
                      {dia}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filas.map(({ plan, asignacion }, index) => {
              const resumen = contarDsFs(asignacion.dias, anio, mes, esColumnaAmarilla);
              return (
                <tr key={`${plan.clave}-${asignacion.id}`}>
                  {todosLosRoles ? (
                    <td className="sticky left-0 z-20 max-w-[7.5rem] truncate border border-slate-400 bg-white px-2 py-0.5 text-[10px] font-medium">
                      {plan.nombre}
                    </td>
                  ) : null}
                  <td
                    className={cn(
                      "sticky z-20 border border-slate-400 bg-white px-1.5 py-0.5 text-center tabular-nums",
                      todosLosRoles ? "left-[7.5rem]" : "left-0",
                    )}
                  >
                    {asignacion.orden || index + 1}
                  </td>
                  <td
                    className={cn(
                      "sticky z-20 border border-slate-400 bg-white px-2 py-0.5 text-center uppercase",
                      todosLosRoles ? "left-[9.25rem]" : "left-[1.75rem]",
                    )}
                  >
                    {asignacion.grado || "—"}
                  </td>
                  <td
                    className={cn(
                      "sticky z-20 min-w-48 border border-slate-400 bg-white px-2 py-0.5 font-medium uppercase",
                      todosLosRoles ? "left-[15.5rem]" : "left-[7.5rem]",
                    )}
                  >
                    {nombreFila(asignacion)}
                  </td>
                  {dias.map((dia) => {
                    const marca = marcaDelDia(asignacion, dia);
                    const amarilla = esColumnaAmarilla(anio, mes, dia);
                    return (
                      <td
                        key={dia}
                        className={cn(
                          "min-w-7 w-7 border border-slate-400 px-0 py-0.5 text-center align-middle",
                          amarilla ? "bg-amber-200/90" : "bg-white",
                          dia === diaHoy && "ring-1 ring-inset ring-sky-400",
                        )}
                      >
                        {canWrite && !todosLosRoles ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => toggleCelda(asignacion, dia)}
                            className={cn(
                              "flex h-6 w-full items-center justify-center font-bold hover:bg-black/5",
                              marca ? "text-slate-900" : "text-transparent hover:text-slate-300",
                            )}
                            title={marca ? `Quitar ${marca}` : `Marcar día ${dia}`}
                            aria-label={
                              marca ? `Quitar marca del día ${dia}` : `Marcar día ${dia}`
                            }
                          >
                            {marca ? <MarcaTexto marca={marca} /> : "·"}
                          </button>
                        ) : marca ? (
                          <span className="font-bold">
                            <MarcaTexto marca={marca} />
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="border border-slate-400 bg-sky-100 px-1.5 py-0.5 text-center tabular-nums">
                    {resumen.ds || "**"}
                  </td>
                  <td className="border border-slate-400 bg-sky-100 px-1.5 py-0.5 text-center tabular-nums">
                    {resumen.fs || "**"}
                  </td>
                  <td className="border border-slate-400 bg-sky-100 px-1.5 py-0.5 text-center font-semibold tabular-nums">
                    {resumen.total || "**"}
                  </td>
                  <td className="border border-slate-400 bg-sky-100 px-1.5 py-0.5" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canWrite ? (
        <GenerarCalendarioDialog
          open={generarOpen}
          onOpenChange={setGenerarOpen}
          planes={planes}
          rolInicialClave={planUnico?.clave ?? null}
          ultimoDia={dias[dias.length - 1] ?? 31}
          pending={pending}
          onApply={(cambios) => {
            onMarcasChange(cambios);
            startTransition(async () => {
              const result = await actualizarMarcasLote(cambios);
              if (!result.ok) setError(result.message);
              else {
                setError(null);
                setGenerarOpen(false);
              }
            });
          }}
        />
      ) : null}

      {pending ? (
        <p className="flex items-center gap-1.5 px-3 pb-2 text-[11px] text-slate-500">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Guardando…
        </p>
      ) : null}
    </div>
  );
}

function MarcaTexto({ marca }: { marca: string }) {
  const turno = turnoDesdeMarca(marca);
  if (turno) return <span className="text-[10px]">{marca}</span>;
  return <>{marca === "X" ? "X" : marca}</>;
}
