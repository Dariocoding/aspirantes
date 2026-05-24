"use client";

import { Pencil, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import { createEfemeride, updateEfemeride } from "@/app/actions/efemerides";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SuccessCelebrationDialog } from "@/components/ui/success-celebration-dialog";
import { useCelebrateOnOkTransition } from "@/hooks/use-celebrate-on-ok-transition";
import { canWrite } from "@/lib/auth/roles";
import { EFEMERIDE_TIPO_OPCIONES, normalizeEfemerideTipo } from "@/lib/efemeride-tipo";
import { MESES_TITULO } from "@/lib/meses";
import type { EfemerideActionState } from "@/lib/action-types";
import { efemerideInitialActionState } from "@/lib/action-types";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma";

export type EfemerideRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  dia: number;
  mes: number;
  tipo: string;
  activa: boolean;
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

function TipoSelect({ id, defaultTipo }: { id: string; defaultTipo: string }) {
  const value = normalizeEfemerideTipo(defaultTipo);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Tipo</Label>
      <Select name="tipo" defaultValue={value} required modal={false}>
        <SelectTrigger id={id} size="default" className="h-9 w-full min-w-0 shadow-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {EFEMERIDE_TIPO_OPCIONES.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MesSelect({ id, defaultMes }: { id: string; defaultMes: number }) {
  const mes = defaultMes >= 1 && defaultMes <= 12 ? defaultMes : 1;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Mes</Label>
      <Select name="mes" defaultValue={String(mes)} required modal={false}>
        <SelectTrigger id={id} size="default" className="h-9 w-full min-w-0 shadow-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {MESES_TITULO.map((nombre, i) => (
            <SelectItem key={nombre} value={String(i + 1)}>
              {nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function EfemerideCreateFormBody({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState<EfemerideActionState, FormData>(
    createEfemeride,
    efemerideInitialActionState,
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
        title="Efeméride guardada"
        description="La fecha conmemorativa quedó registrada en el calendario."
      />
      <form action={formAction} className="grid gap-5 md:grid-cols-2">
      <ErrorList errors={state.errors} />
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="ef-create-nombre">Nombre</Label>
        <Input id="ef-create-nombre" name="nombre" required autoComplete="off" placeholder="Ej. Día de la Independencia" />
      </div>
      <TipoSelect id="ef-create-tipo" defaultTipo="NACIONAL" />
      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Fecha en el calendario</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ef-create-dia">Día</Label>
            <Input id="ef-create-dia" name="dia" type="number" min={1} max={31} required placeholder="1–31" />
          </div>
          <MesSelect id="ef-create-mes" defaultMes={1} />
        </div>
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="ef-create-desc">Descripción</Label>
        <Textarea id="ef-create-desc" name="descripcion" rows={3} placeholder="Contexto o referencia breve (opcional)" />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="submit" className="gap-2 bg-slate-900 shadow-sm hover:bg-slate-800">
          <Save className="h-4 w-4" aria-hidden />
          Guardar efeméride
        </Button>
      </div>
    </form>
    </>
  );
}

export function EfemerideCreateDialog({ role }: { role: UserRole }) {
  const write = canWrite(role);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  if (!write) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full justify-center gap-2 border-slate-800 bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-400 sm:w-auto",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Nueva efeméride
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar efeméride</DialogTitle>
          <DialogDescription>Alta de fechas conmemorativas para el calendario institucional.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">{open ? <EfemerideCreateFormBody onDone={close} /> : null}</div>
      </DialogContent>
    </Dialog>
  );
}

function EfemerideEditFormBody({ item, onDone }: { item: EfemerideRow; onDone: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState<EfemerideActionState, FormData>(
    updateEfemeride,
    efemerideInitialActionState,
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
        title="Cambios guardados"
        description="La efeméride se actualizó correctamente."
      />
      <form action={formAction} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="id" value={item.id} />
      <ErrorList errors={state.errors} />
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`ef-edit-nombre-${item.id}`}>Nombre</Label>
        <Input
          id={`ef-edit-nombre-${item.id}`}
          name="nombre"
          required
          autoComplete="off"
          defaultValue={item.nombre}
        />
      </div>
      <TipoSelect id={`ef-edit-tipo-${item.id}`} defaultTipo={item.tipo} />
      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30">
        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Fecha en el calendario</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`ef-edit-dia-${item.id}`}>Día</Label>
            <Input
              id={`ef-edit-dia-${item.id}`}
              name="dia"
              type="number"
              min={1}
              max={31}
              required
              defaultValue={item.dia}
            />
          </div>
          <MesSelect id={`ef-edit-mes-${item.id}`} defaultMes={item.mes} />
        </div>
      </div>
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor={`ef-edit-desc-${item.id}`}>Descripción</Label>
        <Textarea
          id={`ef-edit-desc-${item.id}`}
          name="descripcion"
          rows={3}
          defaultValue={item.descripcion ?? ""}
        />
      </div>
      <div className="md:col-span-2 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-3 sm:flex-row sm:items-center">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="activa" value="true" defaultChecked={item.activa} className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm font-normal text-slate-800">Efeméride activa (visible en calendarios e informes)</span>
        </label>
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="submit" className="gap-2 bg-slate-900 shadow-sm hover:bg-slate-800">
          <Save className="h-4 w-4" aria-hidden />
          Guardar cambios
        </Button>
      </div>
    </form>
    </>
  );
}

export function EfemerideEditDialog({
  item,
  open,
  onOpenChange,
}: {
  item: EfemerideRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar efeméride</DialogTitle>
          <DialogDescription>Modifique los datos y guarde los cambios.</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {open && item ? <EfemerideEditFormBody key={item.id} item={item} onDone={close} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EfemerideEditTriggerButton({
  item,
  onEdit,
}: {
  item: EfemerideRow;
  onEdit: (item: EfemerideRow) => void;
}) {
  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5 shadow-sm" onClick={() => onEdit(item)}>
      <Pencil className="h-3.5 w-3.5" aria-hidden />
      Editar
    </Button>
  );
}
