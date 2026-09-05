"use client";

import { FileUp, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { importAspirantesFromXlsx } from "@src/app/actions/aspirantes-import";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { Label } from "@src/components/ui/label";
import {
  aspirantesImportInitialActionState,
  type AspirantesImportActionState,
} from "@src/lib/action-types";
import { cn } from "@src/lib/utils";

type Props = {
  convocatoriaId: string;
  convocatoriaLabel: string;
};

function variantLabel(v: "censo" | "examenes-medicos") {
  return v === "examenes-medicos" ? "Exámenes médicos" : "Censo completo";
}

export function AspirantesImportDialog({ convocatoriaId, convocatoriaLabel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    importAspirantesFromXlsx,
    aspirantesImportInitialActionState,
  );

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  useEffect(() => {
    if (state.ok && state.summary) {
      router.refresh();
    }
  }, [state.ok, state.summary, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-9 gap-1.5 border-sky-200/90 bg-sky-50/80 px-2.5 text-sky-950 shadow-sm hover:bg-sky-100/90",
        )}
      >
        <Upload className="h-3.5 w-3.5" aria-hidden />
        Importar
      </DialogTrigger>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-4 w-4 text-sky-800" aria-hidden />
            Importar Excel masivo
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-600">
            Suba el mismo archivo exportado (censo o exámenes médicos), editado. La clave es la{" "}
            <span className="font-medium text-slate-800">cédula</span> dentro de{" "}
            <span className="font-medium text-slate-800">{convocatoriaLabel}</span>. No crea
            aspirantes nuevos: solo actualiza los que ya existen.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 px-5 pb-1">
          <input type="hidden" name="convocatoriaId" value={convocatoriaId} />
          <div className="space-y-2">
            <Label htmlFor="aspirantes-import-file">Archivo .xlsx</Label>
            <Input
              id="aspirantes-import-file"
              name="file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              disabled={pending}
              className="cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-sky-100 file:px-2.5 file:py-1 file:text-sm file:font-medium file:text-sky-950"
            />
            <p className="text-xs text-slate-500">
              Censo: unidad, carrera, admisión, sexo y nacimiento. Exámenes: peso, estatura, tensión y
              checklist SI. No cambie las cabeceras ni la columna de cédula.
            </p>
          </div>

          <ImportFeedback state={state} />

          <DialogFooter className="-mx-5 mt-2 gap-2 border-t-0 px-5 sm:justify-end">
            <Button type="submit" disabled={pending} className="bg-sky-900 hover:bg-sky-800">
              {pending ? "Importando…" : "Importar y actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportFeedback({ state }: { state: AspirantesImportActionState }) {
  const formError = state.errors._form;
  const fileError = state.errors.file;
  const summary = state.summary;

  if (!formError && !fileError && !summary) return null;

  return (
    <div className="space-y-2">
      {formError || fileError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {formError || fileError}
        </div>
      ) : null}
      {summary ? (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-amber-200 bg-amber-50 text-amber-950",
          )}
        >
          <p className="font-medium">
            {variantLabel(summary.variant)} · {summary.updated} actualizado
            {summary.updated === 1 ? "" : "s"} de {summary.totalRows} fila
            {summary.totalRows === 1 ? "" : "s"}
            {summary.notFound > 0
              ? ` · ${summary.notFound} cédula${summary.notFound === 1 ? "" : "s"} no encontrada${summary.notFound === 1 ? "" : "s"}`
              : ""}
          </p>
          {summary.rowErrors.length > 0 ? (
            <ul className="mt-2 max-h-36 list-disc space-y-0.5 overflow-y-auto pl-4 text-xs opacity-90">
              {summary.rowErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
