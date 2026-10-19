"use client";

import { useEffect, useMemo, useState } from "react";
import { Dices, Sparkles } from "lucide-react";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  fusionarMarcas,
  generarCalendarioMultiRol,
  sugerirCuposPorNombreRol,
  type PersonaClave,
  type RolParaCalendario,
} from "@src/lib/roles-servicio/generar-rotacion";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import type { AsignacionVista, PlanVista } from "./types";

function personaDeAsignacion(asignacion: AsignacionVista): PersonaClave {
  return {
    asignacionId: asignacion.id,
    aspiranteId: asignacion.aspirante?.id ?? null,
    autoridadId: asignacion.autoridad?.id ?? null,
    nombre: asignacion.nombre,
  };
}

function nuevaSemilla(): number {
  return (Date.now() ^ (Math.floor(Math.random() * 0xffffffff) >>> 0)) >>> 0;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planes: PlanVista[];
  /** Si hay un rol activo, se preselecciona. */
  rolInicialClave: string | null;
  ultimoDia: number;
  pending: boolean;
  onApply: (cambios: Array<{ asignacionId: string; dias: MarcaDia[] }>) => void;
};

export function GenerarCalendarioDialog({
  open,
  onOpenChange,
  planes,
  rolInicialClave,
  ultimoDia,
  pending,
  onApply,
}: Props) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [desdeDia, setDesdeDia] = useState(1);
  const [hastaDia, setHastaDia] = useState(ultimoDia);
  const [cuposGlobal, setCuposGlobal] = useState(1);
  const [usarCuposSugeridos, setUsarCuposSugeridos] = useState(true);
  const [marca, setMarca] = useState("X");
  const [reemplazar, setReemplazar] = useState(true);
  const [seed, setSeed] = useState(nuevaSemilla);

  useEffect(() => {
    if (!open) return;
    setDesdeDia(1);
    setHastaDia(ultimoDia);
    setCuposGlobal(1);
    setUsarCuposSugeridos(true);
    setMarca("X");
    setReemplazar(true);
    setSeed(nuevaSemilla());
    if (rolInicialClave && planes.some((p) => p.clave === rolInicialClave)) {
      setSeleccionados([rolInicialClave]);
    } else {
      setSeleccionados(planes.map((p) => p.clave));
    }
  }, [open, ultimoDia, rolInicialClave, planes]);

  const rolesInput: RolParaCalendario[] = useMemo(() => {
    return planes
      .filter((p) => seleccionados.includes(p.clave))
      .map((plan) => ({
        clave: plan.clave,
        personas: plan.asignaciones
          .filter((a) => a.nombre.trim() || a.aspirante || a.autoridad)
          .map(personaDeAsignacion),
        cuposPorDia: usarCuposSugeridos
          ? sugerirCuposPorNombreRol(plan.nombre)
          : cuposGlobal,
      }));
  }, [planes, seleccionados, usarCuposSugeridos, cuposGlobal]);

  const preview = useMemo(() => {
    if (rolesInput.length === 0) {
      return { porAsignacion: [], totalMarcas: 0, cuposVacios: 0 };
    }
    return generarCalendarioMultiRol({
      roles: rolesInput,
      desdeDia,
      hastaDia,
      cuposPorDia: cuposGlobal,
      marca,
      seed,
    });
  }, [rolesInput, desdeDia, hastaDia, cuposGlobal, marca, seed]);

  const toggleRol = (clave: string) => {
    setSeleccionados((prev) =>
      prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave],
    );
  };

  const aplicar = () => {
    const nuevasPorId = new Map(
      preview.porAsignacion.map((item) => [item.asignacionId, item.dias]),
    );
    const cambios: Array<{ asignacionId: string; dias: MarcaDia[] }> = [];

    for (const plan of planes) {
      if (!seleccionados.includes(plan.clave)) continue;
      for (const asignacion of plan.asignaciones) {
        const nuevas = nuevasPorId.get(asignacion.id) ?? [];
        // Si reemplazar y no hay marcas nuevas, igual limpiar el rango.
        if (nuevas.length === 0 && !reemplazar) continue;
        if (nuevas.length === 0 && reemplazar && asignacion.dias.every(
          (d) => d.dia < desdeDia || d.dia > hastaDia,
        )) {
          continue;
        }
        cambios.push({
          asignacionId: asignacion.id,
          dias: fusionarMarcas({
            existentes: asignacion.dias,
            nuevas,
            desdeDia,
            hastaDia,
            reemplazarRango: reemplazar,
          }),
        });
      }
    }
    onApply(cambios);
  };

  const personasEnLote = rolesInput.reduce((n, r) => n + r.personas.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(100dvh-2rem,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" aria-hidden />
            Generar calendario
          </DialogTitle>
          <DialogDescription className="text-xs">
            Elija los roles, baraje el orden y se arma la diagonal con el mayor espacio posible.
            Nadie tiene dos servicios el mismo día entre los roles seleccionados.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Roles a incluir</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setSeleccionados(planes.map((p) => p.clave))}
                >
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setSeleccionados([])}
                >
                  Ninguno
                </Button>
              </div>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-slate-50/80 p-2">
              {planes.map((plan) => {
                const checked = seleccionados.includes(plan.clave);
                const cupos = usarCuposSugeridos
                  ? sugerirCuposPorNombreRol(plan.nombre)
                  : cuposGlobal;
                return (
                  <label
                    key={plan.clave}
                    className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 text-xs hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-3.5"
                      checked={checked}
                      onChange={() => toggleRol(plan.clave)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-slate-900">{plan.nombre}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {plan.asignaciones.length} personas
                        {cupos > 1 ? ` · ${cupos} cupos/día` : null}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Desde día</Label>
              <Input
                type="number"
                min={1}
                max={ultimoDia}
                value={desdeDia}
                onChange={(e) => setDesdeDia(Number(e.target.value) || 1)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta día</Label>
              <Input
                type="number"
                min={1}
                max={ultimoDia}
                value={hastaDia}
                onChange={(e) => setHastaDia(Number(e.target.value) || ultimoDia)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Marca</Label>
              <select
                className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
              >
                <option value="X">X</option>
                <option value="T1">T1 (1.er turno)</option>
                <option value="T2">T2 (2.º turno)</option>
                <option value="T3">T3 (3.er turno)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cupos / día</Label>
              <Input
                type="number"
                min={1}
                max={8}
                disabled={usarCuposSugeridos}
                value={cuposGlobal}
                onChange={(e) => setCuposGlobal(Number(e.target.value) || 1)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={usarCuposSugeridos}
              onChange={(e) => setUsarCuposSugeridos(e.target.checked)}
              className="size-3.5"
            />
            Cupos sugeridos por rol (p. ej. 2 en Inspección / Rondín)
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={reemplazar}
              onChange={(e) => setReemplazar(e.target.checked)}
              className="size-3.5"
            />
            Reemplazar marcas del rango en los roles elegidos
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">
              Vista previa:{" "}
              <span className="font-semibold text-slate-900">{preview.totalMarcas}</span> marcas ·{" "}
              {seleccionados.length} roles · {personasEnLote} personas
              {preview.cuposVacios > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-amber-800">
                    {preview.cuposVacios} cupos vacíos (mismo día)
                  </span>
                </>
              ) : null}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[11px]"
              onClick={() => setSeed(nuevaSemilla())}
            >
              <Dices className="size-3.5" aria-hidden />
              Barajar de nuevo
            </Button>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 px-4 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || seleccionados.length === 0 || personasEnLote === 0}
            onClick={aplicar}
          >
            {pending ? "Aplicando…" : "Aplicar calendario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
