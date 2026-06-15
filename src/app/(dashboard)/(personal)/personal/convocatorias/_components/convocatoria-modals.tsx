"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import { deleteConvocatoria } from "@src/app/actions/convocatorias";
import { ConvocatoriaCreateForm } from "@dashboard/convocatorias/_components/convocatoria-create-form";
import { ConvocatoriaEditForm, type ConvocatoriaEditDefaults } from "@dashboard/convocatorias/_components/convocatoria-edit-form";
import { Button, buttonVariants } from "@src/components/ui/button";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/components/ui/dialog";
import {
  convocatoriaInitialActionState,
  type ConvocatoriaActionState,
} from "@src/lib/convocatoria-action-state";
import { cn } from "@src/lib/utils";

export function ConvocatoriaCreateDialog() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full justify-center gap-2 border-slate-800 bg-slate-900 text-white shadow-sm hover:bg-slate-800 focus-visible:ring-slate-400 sm:w-auto",
        )}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Nueva convocatoria
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar convocatoria</DialogTitle>
          <DialogDescription>
            Código único, año visible y nombre para el personal. Solo una convocatoria puede estar activa para recepción
            de aspirantes.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">{open ? <ConvocatoriaCreateForm onSuccess={close} /> : null}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ConvocatoriaEditDialog({ defaults }: { defaults: ConvocatoriaEditDefaults }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: "outline" }),
          "gap-1.5 border-slate-200 text-slate-800 shadow-sm",
        )}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Editar
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar convocatoria</DialogTitle>
          <DialogDescription>
            Actualice código, año o nombre. Para cambiar cuál recibe inscripciones use «Activar recepción» en el listado.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-5">
          {open ? <ConvocatoriaEditForm defaults={defaults} onSuccess={close} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConvocatoriaDeleteDialog({
  convocatoriaId,
  nombre,
}: {
  convocatoriaId: string;
  nombre: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ConvocatoriaActionState, FormData>(
    deleteConvocatoria,
    convocatoriaInitialActionState,
  );
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (next: boolean) => {
      setCelebrateOpen(next);
      if (!next) {
        router.refresh();
        setOpen(false);
      }
    },
    [router, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="deleted"
        title="Convocatoria eliminada"
        description="El período se eliminó del sistema de forma permanente."
      />
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: "destructive" }),
          "gap-1.5 shadow-sm",
        )}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Eliminar
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar convocatoria</DialogTitle>
          <DialogDescription>
            ¿Confirma eliminar «{nombre}»? Esta acción no se puede deshacer. Solo está permitido cuando no hay aspirantes
            registrados en el período.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3 px-5 pb-2">
          <input type="hidden" name="id" value={convocatoriaId} />
          {state.errors._form ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.errors._form}</p>
          ) : null}
          <DialogFooter className="border-0 px-0 pb-0 pt-1 sm:justify-end">
            <Button type="button" variant="secondary" className="sm:mr-auto" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Sí, eliminar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
