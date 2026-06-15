"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback } from "react";
import { updateConvocatoria } from "@src/app/actions/convocatorias";
import {
  convocatoriaInitialActionState,
  type ConvocatoriaActionState,
} from "@src/lib/convocatoria-action-state";
import { Button } from "@src/components/ui/button";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";

function ErrorList({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors).filter(([k]) => k !== "_form");
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

export type ConvocatoriaEditDefaults = {
  id: string;
  codigo: string;
  nombre: string;
  anio: number;
};

type ConvocatoriaEditFormProps = {
  defaults: ConvocatoriaEditDefaults;
  onSuccess?: () => void;
};

export function ConvocatoriaEditForm({ defaults, onSuccess }: ConvocatoriaEditFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<ConvocatoriaActionState, FormData>(
    updateConvocatoria,
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
        variant="saved"
        title="Convocatoria actualizada"
        description="Los datos del período se guardaron correctamente."
      />
      <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="id" value={defaults.id} />
      {state.errors._form ? (
        <p className="md:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.errors._form}
        </p>
      ) : null}
      <ErrorList errors={state.errors} />
      <div>
        <Label htmlFor={`conv-edit-codigo-${defaults.id}`}>Código</Label>
        <Input
          id={`conv-edit-codigo-${defaults.id}`}
          name="codigo"
          required
          defaultValue={defaults.codigo}
          className="font-mono"
        />
        <p className="mt-1 text-xs text-slate-500">Identificador único (informes y filtros).</p>
      </div>
      <div>
        <Label htmlFor={`conv-edit-anio-${defaults.id}`}>Año</Label>
        <Input
          id={`conv-edit-anio-${defaults.id}`}
          name="anio"
          type="number"
          required
          min={2000}
          max={2100}
          defaultValue={defaults.anio}
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor={`conv-edit-nombre-${defaults.id}`}>Nombre descriptivo</Label>
        <Input id={`conv-edit-nombre-${defaults.id}`} name="nombre" required defaultValue={defaults.nombre} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
          Guardar cambios
        </Button>
      </div>
    </form>
    </>
  );
}
