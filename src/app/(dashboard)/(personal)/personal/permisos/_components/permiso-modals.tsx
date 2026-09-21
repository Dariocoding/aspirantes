"use client";

import { Ban, Pencil, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useMemo, useState } from "react";
import { anularPermisoPersonal, createPermisoPersonal, updatePermisoPersonal } from "@src/app/actions/permisos";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";
import { permisoInitialActionState, type PermisoActionState } from "@src/lib/action-types";
import { toDateTimeLocalValue } from "@src/lib/date";
import { PERMISO_TIPO_OPCIONES, type PermisoTipoValue } from "@src/lib/permisos";
import { cn } from "@src/lib/utils";

export type PermisoAspiranteOption = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
};

export type PermisoRow = {
  id: string;
  aspiranteId: string;
  tipo: PermisoTipoValue;
  fechaInicioIso: string;
  fechaFinIso: string;
  motivo: string;
  destino: string | null;
  autorizadoPor: string | null;
  observaciones: string | null;
  anulado: boolean;
};

function ErrorList({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 md:col-span-2">
      {entries.map(([k, v]) => (
        <li key={k}>
          <span className="font-medium">{k}:</span> {v}
        </li>
      ))}
    </ul>
  );
}

function defaultRange() {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(0);
  start.setHours(8);
  const end = new Date(start);
  end.setHours(18);
  return { inicio: toDateTimeLocalValue(start), fin: toDateTimeLocalValue(end) };
}

function AspiranteSelect({
  id,
  aspirantes,
  defaultId,
}: {
  id: string;
  aspirantes: PermisoAspiranteOption[];
  defaultId?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLocaleLowerCase("es");
    if (!n) return aspirantes;
    return aspirantes.filter((a) =>
      `${a.nombres} ${a.apellidos} ${a.cedula}`.toLocaleLowerCase("es").includes(n),
    );
  }, [aspirantes, q]);

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <Label htmlFor={id}>Personal</Label>
      {aspirantes.length > 12 ? (
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar por nombre o cédula"
          autoComplete="off"
        />
      ) : null}
      <Select name="aspiranteId" defaultValue={defaultId || filtered[0]?.id} required modal={false}>
        <SelectTrigger id={id} className="h-9 w-full min-w-0 shadow-xs">
          <SelectValue placeholder="Seleccione" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {filtered.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.nombres} {a.apellidos} · {a.cedula}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TipoPermisoSelect({ id, defaultTipo }: { id: string; defaultTipo: PermisoTipoValue }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Tipo</Label>
      <Select name="tipo" defaultValue={defaultTipo} required modal={false}>
        <SelectTrigger id={id} className="h-9 w-full min-w-0 shadow-xs">
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
  );
}

function PermisoFields({
  prefix,
  aspirantes,
  defaultAspiranteId,
  defaults,
}: {
  prefix: string;
  aspirantes: PermisoAspiranteOption[];
  defaultAspiranteId?: string;
  defaults?: PermisoRow;
}) {
  const range = defaultRange();
  const inicio = defaults ? toDateTimeLocalValue(new Date(defaults.fechaInicioIso)) : range.inicio;
  const fin = defaults ? toDateTimeLocalValue(new Date(defaults.fechaFinIso)) : range.fin;

  return (
    <>
      <AspiranteSelect
        id={`${prefix}-aspirante`}
        aspirantes={aspirantes}
        defaultId={defaults?.aspiranteId ?? defaultAspiranteId}
      />
      <TipoPermisoSelect id={`${prefix}-tipo`} defaultTipo={defaults?.tipo ?? "SALIDA"} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-autorizado`}>Autorizado por</Label>
        <Input
          id={`${prefix}-autorizado`}
          name="autorizadoPor"
          defaultValue={defaults?.autorizadoPor ?? ""}
          placeholder="Grado y nombre (opcional)"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-inicio`}>Desde</Label>
        <Input id={`${prefix}-inicio`} name="fechaInicio" type="datetime-local" required defaultValue={inicio} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-fin`}>Hasta</Label>
        <Input id={`${prefix}-fin`} name="fechaFin" type="datetime-local" required defaultValue={fin} />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`${prefix}-motivo`}>Motivo</Label>
        <Input
          id={`${prefix}-motivo`}
          name="motivo"
          required
          defaultValue={defaults?.motivo ?? ""}
          placeholder="Motivo del permiso"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`${prefix}-destino`}>Destino</Label>
        <Input
          id={`${prefix}-destino`}
          name="destino"
          defaultValue={defaults?.destino ?? ""}
          placeholder="Ciudad, unidad o dirección (opcional)"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`${prefix}-obs`}>Observaciones</Label>
        <Textarea
          id={`${prefix}-obs`}
          name="observaciones"
          rows={2}
          defaultValue={defaults?.observaciones ?? ""}
          placeholder="Notas internas (opcional)"
        />
      </div>
    </>
  );
}

function PermisoCreateFormBody({
  aspirantes,
  defaultAspiranteId,
  onDone,
}: {
  aspirantes: PermisoAspiranteOption[];
  defaultAspiranteId?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<PermisoActionState, FormData>(
    createPermisoPersonal,
    permisoInitialActionState,
  );
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) {
        router.refresh();
        onDone();
      }
    },
    [router, onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="created"
        title="Permiso registrado"
        description="Quedó controlado el intervalo de ausencia de ese personal."
      />
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <ErrorList errors={state.errors} />
        <PermisoFields prefix="perm-create" aspirantes={aspirantes} defaultAspiranteId={defaultAspiranteId} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className="gap-2 bg-slate-900 shadow-sm hover:bg-slate-800">
            <Save className="h-4 w-4" aria-hidden />
            Guardar permiso
          </Button>
        </div>
      </form>
    </>
  );
}

export function PermisoCreateDialog({
  canWrite,
  aspirantes,
  defaultAspiranteId,
}: {
  canWrite: boolean;
  aspirantes: PermisoAspiranteOption[];
  defaultAspiranteId?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full justify-center gap-2 border-slate-800 bg-slate-900 text-white shadow-sm hover:bg-slate-800 sm:w-auto",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Nuevo permiso
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Dar permiso</DialogTitle>
          <DialogDescription>
            Indique a quién, de cuándo a cuándo, y el motivo. No se pueden cruzar dos permisos vigentes del mismo
            aspirante.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {open ? (
            <PermisoCreateFormBody
              aspirantes={aspirantes}
              defaultAspiranteId={defaultAspiranteId}
              onDone={close}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PermisoEditFormBody({
  item,
  aspirantes,
  onDone,
}: {
  item: PermisoRow;
  aspirantes: PermisoAspiranteOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<PermisoActionState, FormData>(
    updatePermisoPersonal,
    permisoInitialActionState,
  );
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) {
        router.refresh();
        onDone();
      }
    },
    [router, onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="saved"
        title="Permiso actualizado"
        description="Se guardaron las fechas y el resto de datos."
      />
      <form action={formAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="id" value={item.id} />
        <ErrorList errors={state.errors} />
        <PermisoFields prefix="perm-edit" aspirantes={aspirantes} defaults={item} />
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" className="gap-2 bg-slate-900 shadow-sm hover:bg-slate-800">
            <Save className="h-4 w-4" aria-hidden />
            Guardar cambios
          </Button>
        </div>
      </form>
    </>
  );
}

export function PermisoEditDialog({
  item,
  aspirantes,
  open,
  onOpenChange,
}: {
  item: PermisoRow | null;
  aspirantes: PermisoAspiranteOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar permiso</DialogTitle>
          <DialogDescription>Ajuste el intervalo o los datos del permiso.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {open && item ? (
            <PermisoEditFormBody item={item} aspirantes={aspirantes} onDone={() => onOpenChange(false)} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PermisoEditTriggerButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" aria-hidden />
      Editar
    </Button>
  );
}

function PermisoAnularFormBody({ id, onDone }: { id: string; onDone: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState<PermisoActionState, FormData>(
    anularPermisoPersonal,
    permisoInitialActionState,
  );
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) {
        router.refresh();
        onDone();
      }
    },
    [router, onDone, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="saved"
        title="Permiso anulado"
        description="Deja de contar como vigencia; queda en el historial."
      />
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="id" value={id} />
        <ErrorList errors={state.errors} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="perm-anular-motivo">Motivo de anulación</Label>
          <Textarea id="perm-anular-motivo" name="anuladoMotivo" rows={3} required />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="destructive" className="gap-2">
            <Ban className="h-4 w-4" aria-hidden />
            Anular
          </Button>
        </div>
      </form>
    </>
  );
}

export function PermisoAnularDialog({
  item,
  open,
  onOpenChange,
}: {
  item: PermisoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anular permiso</DialogTitle>
          <DialogDescription>El registro permanece, pero deja de estar vigente.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {open && item ? (
            <PermisoAnularFormBody id={item.id} onDone={() => onOpenChange(false)} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
