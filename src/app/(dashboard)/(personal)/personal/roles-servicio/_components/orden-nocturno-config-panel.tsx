"use client";

import { useMemo, useState, useTransition } from "react";
import { MoonStar, Plus, Save, Trash2 } from "lucide-react";
import { updateOrdenNocturnoConfig } from "@src/app/actions/orden-nocturno-config";
import { Badge } from "@src/components/ui/badge";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  TURNOS_NOCTURNOS,
  type BinomioNocturnoConfig,
  type OrdenNocturnoConfig,
  type TurnoNocturnoEtiqueta,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import { esRolConTurnoEnMarca } from "@src/lib/roles-servicio/turnos-marca";
import { cn } from "@src/lib/utils";

export type RolOpcion = {
  clave: string;
  nombre: string;
};

type Props = {
  roles: RolOpcion[];
  initialConfig: OrdenNocturnoConfig;
  canWrite: boolean;
};

function toggleClave(list: string[], clave: string): string[] {
  return list.includes(clave) ? list.filter((c) => c !== clave) : [...list, clave];
}

function RolChecklist({
  roles,
  selected,
  onChange,
  disabled,
}: {
  roles: RolOpcion[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtrados = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return roles;
    return roles.filter(
      (r) => r.nombre.toLowerCase().includes(needle) || r.clave.toLowerCase().includes(needle),
    );
  }, [roles, q]);

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar rol…"
        className="h-8 text-xs"
        disabled={disabled}
      />
      <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
        {filtrados.length === 0 ? (
          <p className="px-1 py-2 text-xs text-slate-500">Sin roles que coincidan.</p>
        ) : (
          filtrados.map((rol) => {
            const on = selected.includes(rol.clave);
            return (
              <label
                key={rol.clave}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                  on ? "bg-teal-50 text-teal-950" : "hover:bg-slate-50",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={on}
                  disabled={disabled}
                  onChange={() => onChange(toggleClave(selected, rol.clave))}
                />
                <span className="min-w-0">
                  <span className="block font-medium">{rol.nombre}</span>
                  <span className="block truncate text-[10px] text-slate-500">{rol.clave}</span>
                </span>
              </label>
            );
          })
        )}
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((clave) => {
            const rol = roles.find((r) => r.clave === clave);
            return (
              <Badge key={clave} variant="secondary" className="text-[10px]">
                {rol?.nombre ?? clave}
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function OrdenNocturnoConfigPanel({ roles, initialConfig, canWrite }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rolesAsignables = useMemo(
    () => roles.filter((rol) => !esRolConTurnoEnMarca(rol.nombre)),
    [roles],
  );

  const guardar = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateOrdenNocturnoConfig(config);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfig(result.config);
      setMessage("Configuración de turnos nocturnos guardada.");
    });
  };

  const updateBinomio = (id: string, patch: Partial<BinomioNocturnoConfig>) => {
    setConfig((prev) => ({
      ...prev,
      binomios: prev.binomios.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const addBinomio = () => {
    const n = config.binomios.length + 1;
    const turno = TURNOS_NOCTURNOS[Math.min(n - 1, TURNOS_NOCTURNOS.length - 1)]!;
    setConfig((prev) => ({
      ...prev,
      binomios: [
        ...prev.binomios,
        {
          id: `binomio-${Date.now()}`,
          turno,
          servicioEtiqueta: "IMAGINARIA",
          rolClaves: [],
        },
      ],
    }));
  };

  const removeBinomio = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      binomios: prev.binomios.filter((b) => b.id !== id),
    }));
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-950 text-white">
            <MoonStar className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Orden nocturna</h1>
            <p className="mt-0.5 max-w-xl text-xs text-slate-500">
              Defina qué roles alimentan la Ronda, el Rondín ×2 (inspección) y cada turno de
              imaginaria (binomios). La guardia de estacionamiento entra sola: T1 es primer turno,
              T2 segundo y T3 tercero.
            </p>
          </div>
        </div>
        {canWrite ? (
          <Button type="button" size="sm" disabled={pending} onClick={guardar} className="gap-1.5">
            <Save className="size-3.5" aria-hidden />
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        ) : (
          <p className="text-xs text-amber-800">Solo lectura: su rol no puede editar esta config.</p>
        )}
      </header>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
          {error}
        </p>
      ) : null}

      <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
        <CardHeader className="border-b border-slate-100 px-4 py-3">
          <CardTitle className="text-base">1. Ronda</CardTitle>
          <CardDescription className="text-xs">
            Personal de servicio ese día en el rol elegido → aparece como RONDA en la orden nocturna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Etiqueta en la orden</Label>
              <Input
                value={config.rondaServicioEtiqueta}
                disabled={!canWrite}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, rondaServicioEtiqueta: e.target.value }))
                }
                className="h-8 text-xs uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Turno (columna)</Label>
              <select
                className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs"
                disabled={!canWrite}
                value={config.rondaTurno}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rondaTurno: e.target.value as TurnoNocturnoEtiqueta | "",
                  }))
                }
              >
                <option value="">(sin turno)</option>
                {TURNOS_NOCTURNOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rol fuente (p. ej. Oficial de día)</Label>
            <RolChecklist
              roles={rolesAsignables}
              selected={config.rondaRolClaves}
              disabled={!canWrite}
              onChange={(rondaRolClaves) => setConfig((prev) => ({ ...prev, rondaRolClaves }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
        <CardHeader className="border-b border-slate-100 px-4 py-3">
          <CardTitle className="text-base">2. Rondín (×2)</CardTitle>
          <CardDescription className="text-xs">
            Dos puestos en el 1.er turno, justo después de la Ronda. Toman el personal de Inspección
            (si falta alguien, aparece OMITIR).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Etiqueta en la orden</Label>
              <Input
                value={config.rondinServicioEtiqueta}
                disabled={!canWrite}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, rondinServicioEtiqueta: e.target.value }))
                }
                className="h-8 text-xs uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Turno (columna)</Label>
              <select
                className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs"
                disabled={!canWrite}
                value={config.rondinTurno}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rondinTurno: e.target.value as TurnoNocturnoEtiqueta | "",
                  }))
                }
              >
                <option value="">(sin turno)</option>
                {TURNOS_NOCTURNOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rol fuente (p. ej. Inspección)</Label>
            <RolChecklist
              roles={rolesAsignables}
              selected={config.rondinRolClaves}
              disabled={!canWrite}
              onChange={(rondinRolClaves) => setConfig((prev) => ({ ...prev, rondinRolClaves }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
        <CardHeader className="border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">3. Binomios (imaginaria)</CardTitle>
              <CardDescription className="text-xs">
                1.er turno ← guardia de aula · 2.º ← cuartelero · 3.er ← guardia de baño (ajustable).
              </CardDescription>
            </div>
            {canWrite ? (
              <Button type="button" variant="outline" size="xs" onClick={addBinomio} className="gap-1">
                <Plus className="size-3.5" aria-hidden />
                Añadir turno
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {config.binomios.map((binomio, index) => (
            <div
              key={binomio.id}
              className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-800">Binomio {index + 1}</p>
                {canWrite && config.binomios.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="text-rose-700"
                    onClick={() => removeBinomio(binomio.id)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Quitar
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Turno</Label>
                  <select
                    className="border-input bg-background h-8 w-full rounded-md border px-2 text-xs"
                    disabled={!canWrite}
                    value={binomio.turno}
                    onChange={(e) =>
                      updateBinomio(binomio.id, {
                        turno: e.target.value as TurnoNocturnoEtiqueta,
                      })
                    }
                  >
                    {TURNOS_NOCTURNOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Etiqueta SERVICIO (vacío = nombre del rol)</Label>
                  <Input
                    value={binomio.servicioEtiqueta}
                    disabled={!canWrite}
                    onChange={(e) =>
                      updateBinomio(binomio.id, { servicioEtiqueta: e.target.value })
                    }
                    className="h-8 text-xs uppercase"
                    placeholder="IMAGINARIA"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Roles fuente de este turno</Label>
                <RolChecklist
                  roles={rolesAsignables}
                  selected={binomio.rolClaves}
                  disabled={!canWrite}
                  onChange={(rolClaves) => updateBinomio(binomio.id, { rolClaves })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0 shadow-sm ring-slate-200/80">
        <CardHeader className="border-b border-slate-100 px-4 py-3">
          <CardTitle className="text-base">4. Guardia de estacionamiento</CardTitle>
          <CardDescription className="text-xs">
            Solo nocturno. Cada celda indica el turno: T1 primer turno, T2 segundo turno, T3 tercer
            turno. No se asigna en los binomios.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {roles.some((rol) => esRolConTurnoEnMarca(rol.nombre)) ? (
            <ul className="space-y-1">
              {roles
                .filter((rol) => esRolConTurnoEnMarca(rol.nombre))
                .map((rol) => (
                  <li key={rol.clave} className="text-sm text-slate-800">
                    {rol.nombre}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Todavía no hay un rol de estacionamiento en el mes cargado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
