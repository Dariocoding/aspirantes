"use client";

import type { FormEvent } from "react";
import { useCallback, useState, useTransition } from "react";
import { CalendarClock, FileBadge, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteAspirantesSeleccion } from "@src/app/actions/aspirantes";
import { createPermisosSeleccion, type PermisoSeleccionResult } from "@src/app/actions/permisos";
import { downloadBoletasPermisoPdf } from "@dashboard/aspirantes/_components/boletas-permiso-download";
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
  onClear,
}: {
  people: CensusSelectionPerson[];
  onClear: () => void;
}) {
  const router = useRouter();
  const [permisoOpen, setPermisoOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [boletasBusy, setBoletasBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [omitted, setOmitted] = useState<PermisoSeleccionResult["omitted"]>([]);
  const [celebrate, setCelebrate] = useState<"permiso" | "deleted" | null>(null);
  const [celebrateTitle, setCelebrateTitle] = useState("");
  const [celebrateDetail, setCelebrateDetail] = useState("");
  const [boletasError, setBoletasError] = useState<string | null>(null);
  const range = defaultRange();
  const count = people.length;

  const onCelebrateOpenChange = useCallback((open: boolean) => {
    if (!open) setCelebrate(null);
  }, []);

  const onEliminar = useCallback(() => {
    const msg =
      count === 1
        ? `¿Eliminar del censo a «${people[0]?.nombreCompleto ?? "este aspirante"}»? Dejará de aparecer en el listado. Puede recuperarlo desde la papelera.`
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
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-4 py-2 text-white">
        <span className="text-sm font-medium tabular-nums">{count} seleccionados</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 border-white/20 bg-white text-slate-900 hover:bg-slate-100"
          disabled={pending || boletasBusy}
          onClick={() => {
            setFormError(null);
            setOmitted([]);
            setPermisoOpen(true);
          }}
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Dar permiso
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 border-white/20 bg-transparent text-white hover:bg-white/10"
          disabled={pending || boletasBusy}
          onClick={onBoletas}
        >
          {boletasBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <FileBadge className="h-3.5 w-3.5" aria-hidden />
          )}
          Boletas
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-8"
          disabled={pending || boletasBusy}
          onClick={onEliminar}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {pending ? "Eliminando…" : "Eliminar"}
        </Button>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Quitar selección
        </button>
        {boletasError ? (
          <p className="basis-full text-xs text-rose-200" role="alert">
            {boletasError}
          </p>
        ) : null}
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
