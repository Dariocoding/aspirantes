"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { CalendarClock, FileBadge, GraduationCap, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteAspirantesSeleccion } from "@src/app/actions/aspirantes";
import { createPermisosSeleccion, type PermisoSeleccionResult } from "@src/app/actions/permisos";
import { downloadBoletasPermisoPdf } from "@dashboard/aspirantes/_components/boletas-permiso-download";
import { downloadConstanciaEstudiosPdf } from "@dashboard/aspirantes/_components/constancia-estudios-download";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@src/components/ui/select";
import { Textarea } from "@src/components/ui/textarea";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { toDateTimeLocalValue } from "@src/lib/date";
import { PERMISO_TIPO_OPCIONES } from "@src/lib/permisos";

export type CensusSelectionPerson = {
  id: string;
  nombreCompleto: string;
};

function defaultRange() {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(0);
  start.setHours(8);
  const end = new Date(start);
  end.setHours(18);
  return { inicio: toDateTimeLocalValue(start), fin: toDateTimeLocalValue(end) };
}

export function CensusBulkActions({
  people,
  elsewhereCount = 0,
  onClear,
}: {
  people: CensusSelectionPerson[];
  elsewhereCount?: number;
  onClear: () => void;
}) {
  const router = useRouter();
  const [permisoOpen, setPermisoOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [boletasBusy, setBoletasBusy] = useState(false);
  const [constanciaBusy, setConstanciaBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [omitted, setOmitted] = useState<PermisoSeleccionResult["omitted"]>([]);
  const [celebrate, setCelebrate] = useState<"permiso" | "deleted" | null>(null);
  const [celebrateTitle, setCelebrateTitle] = useState("");
  const [celebrateDetail, setCelebrateDetail] = useState("");
  const [boletasError, setBoletasError] = useState<string | null>(null);
  const [constanciaError, setConstanciaError] = useState<string | null>(null);
  const range = defaultRange();
  const count = people.length;
  const busy = pending || boletasBusy || constanciaBusy;
  const actionError = boletasError ?? constanciaError;

  useEffect(() => {
    if (!count) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "5.5rem";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [count]);

  const onCelebrateOpenChange = useCallback((open: boolean) => {
    if (!open) setCelebrate(null);
  }, []);

  const onEliminar = useCallback(() => {
    const msg =
      count === 1
        ? `¿Eliminar del censo a «${people[0]?.nombreCompleto.trim() || "este aspirante"}»? Dejará de aparecer en el listado. Puede recuperarlo desde la papelera.`
        : `¿Eliminar del censo a ${count} aspirantes? Dejarán de aparecer en el listado. Puede recuperarlos desde la papelera.`;
    if (!confirm(msg)) return;
    const fd = new FormData();
    for (const person of people) fd.append("id", person.id);
    startTransition(async () => {
      const result = await deleteAspirantesSeleccion(fd);
      if (!result.ok) return;
      setCelebrateTitle(result.deleted === 1 ? "Aspirante eliminado del censo" : "Aspirantes eliminados del censo");
      setCelebrateDetail(
        result.deleted === 1
          ? "Ya no aparece en el listado. Si fue un error, puede recuperarlo en la papelera."
          : `${result.deleted} aspirantes salieron del listado. Puede recuperarlos en la papelera.`,
      );
      setCelebrate("deleted");
      onClear();
      router.refresh();
    });
  }, [count, onClear, people, router]);

  const onPermiso = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);
      setOmitted([]);
      const fd = new FormData(event.currentTarget);
      for (const person of people) fd.append("aspiranteId", person.id);
      startTransition(async () => {
        const result = await createPermisosSeleccion(fd);
        setOmitted(result.omitted);
        if (!result.ok) {
          setFormError(result.errors._form ?? Object.values(result.errors)[0] ?? "No se pudo registrar el permiso.");
          return;
        }
        const skipped = result.omitted.length
          ? ` ${result.omitted.length} no se registraron porque ya tenían un permiso en ese intervalo.`
          : "";
        setCelebrateTitle("Permisos registrados");
        setCelebrateDetail(
          result.created === 1
            ? `Quedó registrado para 1 aspirante.${skipped}`
            : `Quedó registrado para ${result.created} aspirantes.${skipped}`,
        );
        setCelebrate("permiso");
        setPermisoOpen(false);
        onClear();
        router.refresh();
      });
    },
    [onClear, people, router],
  );

  const onBoletas = useCallback(() => {
    setBoletasError(null);
    setBoletasBusy(true);
    void downloadBoletasPermisoPdf({
      ids: people.map((person) => person.id),
      fallbackName: "boletas-permiso.pdf",
    })
      .catch((error) => setBoletasError(error instanceof Error ? error.message : "No se pudo descargar."))
      .finally(() => setBoletasBusy(false));
  }, [people]);

  const onConstancia = useCallback(() => {
    setConstanciaError(null);
    setConstanciaBusy(true);
    void downloadConstanciaEstudiosPdf({
      ids: people.map((person) => person.id),
      fallbackName: "constancias-estudios.pdf",
    })
      .catch((error) => setConstanciaError(error instanceof Error ? error.message : "No se pudo descargar."))
      .finally(() => setConstanciaBusy(false));
  }, [people]);

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrate === "permiso"}
        onOpenChange={onCelebrateOpenChange}
        variant="created"
        title={celebrateTitle}
        description={celebrateDetail}
      />
      <SuccessCelebrationDialog
        open={celebrate === "deleted"}
        onOpenChange={onCelebrateOpenChange}
        variant="deleted"
        title={celebrateTitle}
        description={celebrateDetail}
      />
      {count ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:left-60 print:hidden">
          <div className="pointer-events-auto flex w-full max-w-xl flex-col gap-2">
            {actionError ? (
              <p
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 shadow-sm"
                role="alert"
              >
                {actionError}
              </p>
            ) : null}
            <div
              role="region"
              aria-label="Selección del censo"
              className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.55)] ring-1 ring-slate-900/5 backdrop-blur-md"
            >
              <span className="h-9 w-1 shrink-0 rounded-full bg-[#c4a35a]" aria-hidden />
              <p className="min-w-0 flex-1 text-sm leading-tight text-slate-900">
                <span className="font-semibold tabular-nums">
                  {count === 1 ? "1 seleccionado" : `${count} seleccionados`}
                </span>
                {elsewhereCount > 0 ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                    {elsewhereCount === 1 ? "1 en otra página" : `${elsewhereCount} en otras páginas`}
                  </span>
                ) : null}
              </p>
              <Select
                value={null}
                modal={false}
                disabled={busy}
                onValueChange={(value) => {
                  if (value === "permiso") {
                    setFormError(null);
                    setOmitted([]);
                    setPermisoOpen(true);
                  } else if (value === "boletas") {
                    onBoletas();
                  } else if (value === "constancia") {
                    onConstancia();
                  } else if (value === "eliminar") {
                    onEliminar();
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Acciones para la selección"
                  className="h-9 min-w-40 border-slate-200 bg-slate-900 text-white shadow-none hover:bg-slate-800 data-placeholder:text-white [&_svg]:text-white"
                >
                  {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                  <SelectValue placeholder={busy ? "Trabajando…" : "Acciones"} />
                </SelectTrigger>
                <SelectContent side="top" align="end" className="min-w-48">
                  <SelectItem value="permiso">
                    <CalendarClock aria-hidden />
                    Dar permiso
                  </SelectItem>
                  <SelectItem value="boletas">
                    <FileBadge aria-hidden />
                    Boletas
                  </SelectItem>
                  <SelectItem value="constancia">
                    <GraduationCap aria-hidden />
                    Constancia
                  </SelectItem>
                  <SelectSeparator />
                  <SelectItem value="eliminar" className="text-red-700 focus:bg-red-50 focus:text-red-800">
                    <Trash2 aria-hidden />
                    Eliminar
                  </SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Quitar selección"
                onClick={onClear}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={permisoOpen && count > 0} onOpenChange={setPermisoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permiso para la selección</DialogTitle>
            <DialogDescription>
              El mismo permiso se registrará para {count === 1 ? "1 aspirante" : `${count} aspirantes`}. Quien ya tenga
              otro permiso en ese intervalo se omite.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onPermiso}>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
            {formError ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2" role="alert">
                {formError}
              </p>
            ) : null}
            {omitted.length ? (
              <ul className="max-h-28 overflow-auto rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 md:col-span-2">
                {omitted.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">{item.nombre}:</span> {item.reason}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-tipo">Tipo</Label>
              <Select name="tipo" defaultValue="SALIDA" required modal={false}>
                <SelectTrigger id="bulk-tipo" className="h-9 w-full min-w-0 shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISO_TIPO_OPCIONES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-autorizado">Autorizado por</Label>
              <Input id="bulk-autorizado" name="autorizadoPor" placeholder="Grado y nombre (opcional)" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-inicio">Desde</Label>
              <Input id="bulk-inicio" name="fechaInicio" type="datetime-local" required defaultValue={range.inicio} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bulk-fin">Hasta</Label>
              <Input id="bulk-fin" name="fechaFin" type="datetime-local" required defaultValue={range.fin} />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="bulk-motivo">Motivo</Label>
              <Input id="bulk-motivo" name="motivo" required placeholder="Motivo del permiso" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="bulk-destino">Destino</Label>
              <Input id="bulk-destino" name="destino" placeholder="Ciudad, unidad o dirección (opcional)" autoComplete="off" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="bulk-obs">Observaciones</Label>
              <Textarea id="bulk-obs" name="observaciones" rows={2} placeholder="Notas internas (opcional)" />
            </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPermisoOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} className="bg-slate-900 hover:bg-slate-800">
                {pending ? "Guardando…" : "Registrar permiso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
