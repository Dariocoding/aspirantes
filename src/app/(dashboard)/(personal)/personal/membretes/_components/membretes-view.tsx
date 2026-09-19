"use client";

import { Plus, Save, Stamp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { createMembrete, deleteMembrete, updateMembrete } from "@src/app/actions/membretes";
import { MembretePreview } from "@dashboard/membretes/_components/membrete-preview";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/components/ui/select";
import { Textarea } from "@src/components/ui/textarea";
import { membreteInitialActionState } from "@src/lib/action-types";
import {
  membreteLineasToText,
  parseMembreteLineas,
  PLANTILLA_MEMBRETE_CEFOA45,
  type MembreteLogoKind,
} from "@src/lib/membrete";
import { cn } from "@src/lib/utils";

export type MembreteRow = {
  id: string;
  nombre: string;
  lineas: string[];
  logoIzq: MembreteLogoKind;
  logoDer: MembreteLogoKind;
  isDefault: boolean;
};

type Props = {
  membretes: MembreteRow[];
  canWrite: boolean;
};

const NEW_ID = "new";

function LogoSelect({
  id,
  label,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  value: MembreteLogoKind;
  onValueChange: (v: MembreteLogoKind) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === "none" || v === "cefoa" || v === "ejercito") onValueChange(v);
        }}
      >
        <SelectTrigger id={id} className="h-9 w-full min-w-0 shadow-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin logo</SelectItem>
          <SelectItem value="ejercito">Escudo del Ejército</SelectItem>
          <SelectItem value="cefoa">Escudo C.E.F.O.A.</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function MembretesView({ membretes, canWrite }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(membretes[0]?.id ?? NEW_ID);
  const selected = membretes.find((m) => m.id === selectedId) ?? null;
  const isNew = selectedId === NEW_ID || !selected;

  const [nombre, setNombre] = useState(selected?.nombre ?? "");
  const [lineasTexto, setLineasTexto] = useState(
    selected ? membreteLineasToText(selected.lineas) : membreteLineasToText(PLANTILLA_MEMBRETE_CEFOA45),
  );
  const [logoIzq, setLogoIzq] = useState<MembreteLogoKind>(selected?.logoIzq ?? "ejercito");
  const [logoDer, setLogoDer] = useState<MembreteLogoKind>(selected?.logoDer ?? "cefoa");
  const [isDefault, setIsDefault] = useState(selected?.isDefault ?? membretes.length === 0);

  const [createState, createAction, createPending] = useActionState(
    createMembrete,
    membreteInitialActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateMembrete,
    membreteInitialActionState,
  );

  const state = isNew ? createState : updateState;
  const pending = createPending || updatePending;

  useEffect(() => {
    if (isNew) {
      setNombre("");
      setLineasTexto(membreteLineasToText(PLANTILLA_MEMBRETE_CEFOA45));
      setLogoIzq("ejercito");
      setLogoDer("cefoa");
      setIsDefault(membretes.length === 0);
      return;
    }
    if (!selected) return;
    setNombre(selected.nombre);
    setLineasTexto(membreteLineasToText(selected.lineas));
    setLogoIzq(selected.logoIzq);
    setLogoDer(selected.logoDer);
    setIsDefault(selected.isDefault);
  }, [isNew, selected, membretes.length]);

  useEffect(() => {
    if (createState.ok && createState.id) {
      setSelectedId(createState.id);
      router.refresh();
    }
  }, [createState.ok, createState.id, router]);

  useEffect(() => {
    if (updateState.ok) router.refresh();
  }, [updateState.ok, router]);

  const previewLineas = useMemo(() => parseMembreteLineas(lineasTexto), [lineasTexto]);
  const errors = state.errors;

  function selectExisting(id: string) {
    setSelectedId(id);
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50 via-white to-amber-50/30 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <Stamp className="h-5 w-5 text-slate-800" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Membretes</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Diseñe encabezados institucionales y elíjalos al exportar Excel. El listado y las
                columnas no cambian: el membrete se coloca encima del título.
              </p>
            </div>
          </div>
        </div>
      </section>

      {!canWrite ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Su rol es de solo consulta: puede ver los membretes, pero no crearlos ni editarlos.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <Card className="overflow-hidden border-slate-200/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Plantillas</CardTitle>
                <CardDescription className="text-xs">Pulse una para editarla.</CardDescription>
              </div>
              {canWrite ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setSelectedId(NEW_ID)}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Nuevo
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {canWrite ? (
              <button
                type="button"
                onClick={() => setSelectedId(NEW_ID)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm",
                  isNew
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-dashed border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                Nuevo membrete
              </button>
            ) : null}
            {membretes.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-slate-500">Aún no hay membretes.</p>
            ) : (
              <ul className="space-y-2">
                {membretes.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => selectExisting(m.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                        selectedId === m.id
                          ? "border-slate-800 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:bg-slate-50",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{m.nombre}</span>
                        {m.isDefault ? (
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                              selectedId === m.id ? "bg-white/15" : "bg-emerald-50 text-emerald-800",
                            )}
                          >
                            Predeterminado
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-xs",
                          selectedId === m.id ? "text-white/70" : "text-slate-500",
                        )}
                      >
                        {m.lineas[0]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-3">
            <CardTitle className="text-base">{isNew ? "Diseñar membrete" : "Editar membrete"}</CardTitle>
            <CardDescription className="text-xs">
              Un renglón por línea. La vista previa imita el encabezado del Excel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <MembretePreview lineas={previewLineas} logoIzq={logoIzq} logoDer={logoDer} />

            <form action={isNew ? createAction : updateAction} className="grid gap-4">
              {!isNew ? <input type="hidden" name="id" value={selectedId} /> : null}
              <input type="hidden" name="logoIzq" value={logoIzq} />
              <input type="hidden" name="logoDer" value={logoDer} />
              {Object.keys(errors).length ? (
                <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {Object.entries(errors).map(([k, v]) => (
                    <li key={k}>
                      <span className="font-medium">{k}:</span> {v}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="membrete-nombre">Nombre</Label>
                <Input
                  id="membrete-nombre"
                  name="nombre"
                  required
                  disabled={!canWrite}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. CEFOA 45"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="membrete-lineas">Renglones</Label>
                  {canWrite ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setLineasTexto(membreteLineasToText(PLANTILLA_MEMBRETE_CEFOA45))}
                    >
                      Plantilla CEFOA 45
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  id="membrete-lineas"
                  name="lineasTexto"
                  rows={6}
                  disabled={!canWrite}
                  value={lineasTexto}
                  onChange={(e) => setLineasTexto(e.target.value)}
                  className="font-sans text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LogoSelect
                  id="logo-izq"
                  label="Logo izquierdo"
                  value={logoIzq}
                  onValueChange={setLogoIzq}
                />
                <LogoSelect
                  id="logo-der"
                  label="Logo derecho"
                  value={logoDer}
                  onValueChange={setLogoDer}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isDefault"
                  className="size-3.5 accent-emerald-700"
                  checked={isDefault}
                  disabled={!canWrite}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                Usar como predeterminado al exportar
              </label>

              {canWrite ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {!isNew ? (
                    <Button
                      type="submit"
                      formAction={deleteMembrete}
                      variant="ghost"
                      className="gap-1.5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                      onClick={(e) => {
                        if (!confirm("¿Eliminar este membrete?")) e.preventDefault();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      Eliminar
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button type="submit" disabled={pending} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    {pending ? "Guardando…" : isNew ? "Crear membrete" : "Guardar cambios"}
                  </Button>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
