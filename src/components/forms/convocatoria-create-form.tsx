"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback } from "react";
import { createConvocatoria } from "@/app/actions/convocatorias";
import {
  convocatoriaInitialActionState,
  type ConvocatoriaActionState,
} from "@/lib/convocatoria-action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuccessCelebrationDialog } from "@/components/ui/success-celebration-dialog";
import { useCelebrateOnOkTransition } from "@/hooks/use-celebrate-on-ok-transition";

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

type ConvocatoriaCreateFormProps = {
  onSuccess?: () => void;
};

export function ConvocatoriaCreateForm({ onSuccess }: ConvocatoriaCreateFormProps = {}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ConvocatoriaActionState, FormData>(
    createConvocatoria,
    convocatoriaInitialActionState,
  );
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const onCelebrateOpenChange = useCallback(
    (open: boolean) => {
      setCelebrateOpen(open);
      if (!open) {
        router.refresh();
        onSuccess?.();
      }
    },
    [router, onSuccess, setCelebrateOpen],
  );

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={onCelebrateOpenChange}
        variant="created"
        title="Convocatoria creada"
        description="El período quedó registrado. Puede activar la recepción desde el listado si aún no lo hizo."
      />
      <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <ErrorList errors={state.errors} />
      <div>
        <Label htmlFor="conv-codigo">Código</Label>
        <Input id="conv-codigo" name="codigo" required placeholder="ej. 2026-II" className="font-mono" />
        <p className="mt-1 text-xs text-slate-500">Identificador único (informes y filtros).</p>
      </div>
      <div>
        <Label htmlFor="conv-anio">Año</Label>
        <Input id="conv-anio" name="anio" type="number" required min={2000} max={2100} defaultValue={new Date().getFullYear()} />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="conv-nombre">Nombre descriptivo</Label>
        <Input id="conv-nombre" name="nombre" required placeholder="Censo de aspirantes 2026 — segunda etapa" />
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input id="conv-marcar" type="checkbox" name="marcarActiva" className="h-4 w-4 rounded border-slate-300" />
        <Label htmlFor="conv-marcar" className="mb-0 font-normal text-slate-700">
          Activar esta convocatoria (cierra la recepción en la que estaba activa antes)
        </Label>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
          Crear convocatoria
        </Button>
      </div>
    </form>
    </>
  );
}
