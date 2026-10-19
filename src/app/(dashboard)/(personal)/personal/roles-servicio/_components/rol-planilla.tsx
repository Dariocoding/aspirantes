"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { actualizarMarcasAsignacion } from "@src/app/actions/roles-servicio-marcas";
import {
  esColumnaAmarilla,
  letraSemana,
  type MarcaDia,
} from "@src/lib/roles-servicio/marcas";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";
import { cn } from "@src/lib/utils";
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
  onSelectDia,
  onMarcasChange,
}: Props) {
  const [pending, startTransition] = useTransition();
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

  return (
    <div className="flex w-full min-w-0 flex-col">
      {error ? (
        <p className="px-3 py-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="w-full min-w-0">
        <table className="w-full table-fixed border-collapse text-[11px] text-slate-900">
          <colgroup>
            <col className="w-8" />
            {todosLosRoles ? <col className="w-[6.5rem]" /> : null}
            <col className="w-44" />
            {dias.map((dia) => (
              <col key={`c-${dia}`} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-30 border border-slate-400 bg-slate-100 px-1 py-1 font-bold"
              >
                №
              </th>
              {todosLosRoles ? (
                <th
                  rowSpan={2}
                  className="sticky left-8 z-30 border border-slate-400 bg-slate-100 px-1.5 py-1 text-left font-bold uppercase"
                >
                  Rol
                </th>
              ) : null}
              <th
                rowSpan={2}
                className={cn(
                  "sticky z-30 border border-slate-400 bg-slate-100 px-2 py-1 text-left font-bold uppercase",
                  todosLosRoles ? "left-[8.5rem]" : "left-8",
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
                      "border border-slate-400 px-0 py-0.5 text-center font-bold",
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
            </tr>
            <tr>
              {dias.map((dia) => {
                const amarilla = esColumnaAmarilla(anio, mes, dia);
                const sel = dia === diaSeleccionado;
                return (
                  <th
                    key={`n-${dia}`}
                    className={cn(
                      "border border-slate-400 px-0 py-0.5 text-center font-bold tabular-nums",
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
            {filas.map(({ plan, asignacion }, index) => (
                <tr key={`${plan.clave}-${asignacion.id}`}>
                  <td className="sticky left-0 z-20 border border-slate-400 bg-white px-1 py-0.5 text-center tabular-nums">
                    {asignacion.orden || index + 1}
                  </td>
                  {todosLosRoles ? (
                    <td
                      className="sticky left-8 z-20 truncate border border-slate-400 bg-white px-1.5 py-0.5 text-[10px] font-medium"
                      title={plan.nombre}
                    >
                      {plan.nombre}
                    </td>
                  ) : null}
                  <td
                    className={cn(
                      "sticky z-20 truncate border border-slate-400 bg-white px-2 py-0.5 font-medium uppercase",
                      todosLosRoles ? "left-[8.5rem]" : "left-8",
                    )}
                    title={nombreFila(asignacion)}
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
                          "border border-slate-400 px-0 py-0.5 text-center align-middle",
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
                              "flex h-7 w-full items-center justify-center font-bold hover:bg-black/5",
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
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending ? (
        <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-slate-500">
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
