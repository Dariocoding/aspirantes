"use client";

import { Save, Stamp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { updateFormatoPermiso } from "@src/app/actions/formato-permiso";
import { FormatoPermisoPreview } from "@dashboard/permisos/_components/formato-permiso-preview";
import { Button, buttonVariants } from "@src/components/ui/button";
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
import { formatoPermisoInitialActionState } from "@src/lib/action-types";
import { routes } from "@src/lib/apps/routes";
import type { MembreteLogoKind } from "@src/lib/membrete";
import {
  DEFAULT_FORMATO_PERMISO,
  FORMATO_PERMISO_EJEMPLO,
  formatoPermisoLineasToText,
  parseFormatoPermisoLineas,
  presentarFormatoPermiso,
  type FormatoPermisoPlantilla,
} from "@src/lib/pdf/formato-permiso";
import { cn } from "@src/lib/utils";

function LogoSelect({
  id,
  label,
  value,
  disabled,
  onValueChange,
}: {
  id: string;
  label: string;
  value: MembreteLogoKind;
  disabled?: boolean;
  onValueChange: (value: MembreteLogoKind) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        disabled={disabled}
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
          <SelectItem value="cefoa">Escudo del C.E.F.O.A.</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function FormatoPermisoView({
  plantilla,
  canWrite,
  comandanteNombre,
}: {
  plantilla: FormatoPermisoPlantilla;
  canWrite: boolean;
  comandanteNombre: string | null;
}) {
  const router = useRouter();
  const [lineasTexto, setLineasTexto] = useState(formatoPermisoLineasToText(plantilla.lineas));
  const [logoIzq, setLogoIzq] = useState<MembreteLogoKind>(plantilla.logoIzq);
  const [logoDer, setLogoDer] = useState<MembreteLogoKind>(plantilla.logoDer);
  const [titulo, setTitulo] = useState(plantilla.titulo);
  const [compania, setCompania] = useState(plantilla.compania);
  const [firmanteNombre, setFirmanteNombre] = useState(plantilla.firmanteNombre);
  const [firmanteCargo, setFirmanteCargo] = useState(plantilla.firmanteCargo);
  const [nota, setNota] = useState(plantilla.nota);
  const [state, action, pending] = useActionState(updateFormatoPermiso, formatoPermisoInitialActionState);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const presentacion = useMemo(
    () =>
      presentarFormatoPermiso(
        {
          lineas: parseFormatoPermisoLineas(lineasTexto),
          logoIzq,
          logoDer,
          titulo,
          compania,
          firmanteNombre,
          firmanteCargo,
          nota,
        },
        {
          ...FORMATO_PERMISO_EJEMPLO,
          comandanteNombre: firmanteNombre.trim() ? null : comandanteNombre,
        },
      ),
    [lineasTexto, logoIzq, logoDer, titulo, compania, firmanteNombre, firmanteCargo, nota, comandanteNombre],
  );

  function restaurar() {
    const base = DEFAULT_FORMATO_PERMISO;
    setLineasTexto(formatoPermisoLineasToText(base.lineas));
    setLogoIzq(base.logoIzq);
    setLogoDer(base.logoDer);
    setTitulo(base.titulo);
    setCompania(base.compania);
    setFirmanteNombre(base.firmanteNombre);
    setFirmanteCargo(base.firmanteCargo);
    setNota(base.nota);
  }

  const errors = state.errors;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50 via-white to-amber-50/30 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <Stamp className="h-5 w-5 text-slate-800" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Formato de la boleta</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Encabezado, compañía, firmante y nota de la boleta que representa cada permiso. La
                persona, las fechas y el tipo salen del permiso. El impreso va en mayúsculas.
              </p>
            </div>
          </div>
          <Link
            href={routes.personal.permisos}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
          >
            Volver a permisos
          </Link>
        </div>
      </section>

      {!canWrite ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Su rol es de solo consulta: puede ver el formato, pero no editarlo.
        </p>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)]">
        <Card className="overflow-hidden border-slate-200/90 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-3">
            <CardTitle className="text-base">Textos del formato</CardTitle>
            <CardDescription className="text-xs">
              Un renglón por línea en el encabezado. Si la compañía queda vacía, cada boleta usa el
              pelotón del aspirante o, si no tiene, su unidad postulante.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form action={action} className="grid gap-4">
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
              {state.ok ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  Formato guardado. Las próximas boletas usan estos textos.
                </p>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="formato-lineas">Encabezado</Label>
                  {canWrite ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={restaurar}>
                      Restaurar plantilla CEFOA
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  id="formato-lineas"
                  name="lineasTexto"
                  rows={6}
                  disabled={!canWrite}
                  value={lineasTexto}
                  onChange={(e) => setLineasTexto(e.target.value)}
                  className="font-sans text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LogoSelect id="logo-izq" label="Logo izquierdo" value={logoIzq} disabled={!canWrite} onValueChange={setLogoIzq} />
                <LogoSelect id="logo-der" label="Logo derecho" value={logoDer} disabled={!canWrite} onValueChange={setLogoDer} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="formato-titulo">Título</Label>
                  <Input
                    id="formato-titulo"
                    name="titulo"
                    required
                    disabled={!canWrite}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="formato-compania">Compañía</Label>
                  <Input
                    id="formato-compania"
                    name="compania"
                    disabled={!canWrite}
                    value={compania}
                    onChange={(e) => setCompania(e.target.value)}
                    placeholder="Vacío: pelotón o unidad"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="formato-firmante">Nombre del firmante</Label>
                  <Input
                    id="formato-firmante"
                    name="firmanteNombre"
                    disabled={!canWrite}
                    value={firmanteNombre}
                    onChange={(e) => setFirmanteNombre(e.target.value)}
                    placeholder={comandanteNombre?.trim() || "Comandante de la convocatoria"}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="formato-cargo">Cargo del firmante</Label>
                  <Input
                    id="formato-cargo"
                    name="firmanteCargo"
                    disabled={!canWrite}
                    value={firmanteCargo}
                    onChange={(e) => setFirmanteCargo(e.target.value)}
                  />
                </div>
              </div>
              {!firmanteNombre.trim() && comandanteNombre?.trim() ? (
                <p className="-mt-2 text-xs text-slate-500">
                  Si el nombre queda vacío, la boleta usa al comandante de la convocatoria activa:{" "}
                  {comandanteNombre}.
                </p>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="formato-nota">Nota al pie</Label>
                <Textarea
                  id="formato-nota"
                  name="nota"
                  rows={4}
                  disabled={!canWrite}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="font-sans text-sm"
                />
              </div>

              {canWrite ? (
                <div className="flex justify-end">
                  <Button type="submit" disabled={pending} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    {pending ? "Guardando…" : "Guardar formato"}
                  </Button>
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <div className="xl:sticky xl:top-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Vista previa con un permiso de ejemplo
          </p>
          <FormatoPermisoPreview presentacion={presentacion} />
        </div>
      </div>
    </div>
  );
}
