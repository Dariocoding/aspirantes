"use client";

import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { letraSemana } from "@src/lib/roles-servicio/marcas";
import {
  aPlanDiurno,
  cambiosAlAplicarSugerencias,
  detectarRepeticionesDiurnas,
  sugerirRelevosDiurnos,
  type SugerenciaRelevoDiurno,
} from "@src/lib/roles-servicio/repeticiones-diurno";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import type { PlanVista } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planes: PlanVista[];
  anio: number;
  mes: number;
  canWrite: boolean;
  pending: boolean;
  onApply: (cambios: Array<{ asignacionId: string; dias: MarcaDia[] }>) => void;
};

function claveSugerencia(sugerencia: SugerenciaRelevoDiurno): string {
  return `${sugerencia.dia}:${sugerencia.moverDe.asignacionId}`;
}

export function VerificarDiurnoDialog({
  open,
  onOpenChange,
  planes,
  anio,
  mes,
  canWrite,
  pending,
  onApply,
}: Props) {
  const planesDiurno = useMemo(() => aPlanDiurno(planes), [planes]);
  const repeticiones = useMemo(() => detectarRepeticionesDiurnas(planesDiurno), [planesDiurno]);
  const sugerencias = useMemo(() => sugerirRelevosDiurnos(planesDiurno), [planesDiurno]);
  const [elegidas, setElegidas] = useState<string[]>([]);

  const aplicables = sugerencias.filter((item) => item.relevo);
  const marcadas = sugerencias.filter(
    (item) => item.relevo && elegidas.includes(claveSugerencia(item)),
  );

  const alternar = (sugerencia: SugerenciaRelevoDiurno) => {
    const clave = claveSugerencia(sugerencia);
    setElegidas((prev) => (prev.includes(clave) ? prev.filter((item) => item !== clave) : [...prev, clave]));
  };

  const aplicar = (lista: SugerenciaRelevoDiurno[]) => {
    const cambios = cambiosAlAplicarSugerencias(planesDiurno, lista);
    if (cambios.length === 0) return;
    onApply(cambios);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(100dvh-2rem,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-4" aria-hidden />
            Guardias diurnas
          </DialogTitle>
          <DialogDescription className="text-xs">
            Una persona no puede estar en dos servicios diurnos el mismo día. El nocturno y el
            estacionamiento no cuentan.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {repeticiones.length === 0 ? (
            <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-3 text-sm text-teal-800">
              Nadie repite guardia diurna en este mes.
            </p>
          ) : (
            <ul className="space-y-2">
              {sugerencias.map((sugerencia) => {
                const clave = claveSugerencia(sugerencia);
                const marcada = elegidas.includes(clave);
                return (
                  <li key={clave} className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">
                      Día {sugerencia.dia}
                      <span className="font-normal text-slate-500">
                        {" "}
                        · {letraSemana(anio, mes, sugerencia.dia)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-700">
                      {sugerencia.nombre} se queda en {sugerencia.seQuedaEn} y también está en{" "}
                      {sugerencia.moverDe.planNombre}.
                    </p>
                    {sugerencia.relevo ? (
                      <label className="mt-2 flex items-start gap-2 text-xs text-slate-800">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={marcada}
                          disabled={!canWrite || pending}
                          onChange={() => alternar(sugerencia)}
                        />
                        <span>
                          Pasar {sugerencia.moverDe.planNombre} a {sugerencia.relevo.nombre}
                          {sugerencia.relevo.grado ? ` (${sugerencia.relevo.grado})` : ""}. Lleva más
                          tiempo sin esa guardia.
                        </span>
                      </label>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        No hay nadie libre en {sugerencia.moverDe.planNombre} ese día.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {aplicables.length > 0 && canWrite ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || marcadas.length === 0}
              onClick={() => aplicar(marcadas)}
            >
              Aplicar elegidas
            </Button>
            <Button type="button" size="sm" disabled={pending} onClick={() => aplicar(aplicables)}>
              Aplicar todas
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
