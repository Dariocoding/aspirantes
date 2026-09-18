"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { cn } from "@src/lib/utils";

type ImportResult = {
  message: string;
  updated: number;
  created: number;
  unchanged: number;
  errors: { excelRow: number; cedula: string; message: string }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convocatoriaId: string;
};

export function AspirantesExcelImportDialog({ open, onOpenChange, convocatoriaId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setFile(null);
    setDragOver(false);
    setError(null);
    setResult(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function takeFile(next: File | null) {
    if (!next) return;
    const name = next.name.toLowerCase();
    if (!name.endsWith(".xlsx")) {
      setError("Use un archivo Excel (.xlsx) exportado del censo.");
      setFile(null);
      setResult(null);
      return;
    }
    setFile(next);
    setError(null);
    setResult(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && busy) return;
    if (!next) reset();
    onOpenChange(next);
  }

  async function runImport() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.set("convocatoria", convocatoriaId);
      body.set("file", file);
      const res = await fetch("/api/aspirantes/censo/import", {
        method: "POST",
        body,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as (ImportResult & { message?: string }) | null;
      if (!res.ok) {
        throw new Error(data?.message ?? `No se pudo importar (${res.status}).`);
      }
      setResult(data as ImportResult);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar el archivo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-4 w-4 text-emerald-700" aria-hidden />
            Importar Excel
          </DialogTitle>
          <DialogDescription>
            Use un Excel exportado del censo. La cédula identifica a cada aspirante: se actualizan
            solo las columnas presentes. Si la cédula no existe y hay nombre, se da de alta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              takeFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (busy) return;
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (busy) return;
              takeFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
              dragOver
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-300 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-50",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                dragOver ? "bg-emerald-100 text-emerald-800" : "bg-white text-emerald-700 shadow-xs",
              )}
            >
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
            </span>
            {file ? (
              <>
                <span className="text-sm font-medium text-slate-900">{file.name}</span>
                <span className="text-xs tabular-nums text-slate-500">
                  {(file.size / 1024).toFixed(0)} KB · suelte otro archivo o haga clic para cambiarlo
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-slate-900">
                  Arrastre el Excel aquí o haga clic para elegir
                </span>
                <span className="text-xs text-slate-500">Solo .xlsx · N° y edad no se escriben</span>
              </>
            )}
          </button>

          {error ? (
            <p className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
              <p className="font-medium">{result.message}</p>
              <p className="mt-1 text-xs tabular-nums text-slate-500">
                {result.updated} actualizados · {result.created} altas
                {result.unchanged ? ` · ${result.unchanged} sin cambios` : ""}
              </p>
              {result.errors.length ? (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-rose-800">
                  {result.errors.slice(0, 30).map((err) => (
                    <li key={`${err.excelRow}-${err.cedula}`}>
                      Fila {err.excelRow} · {err.cedula}: {err.message}
                    </li>
                  ))}
                  {result.errors.length > 30 ? (
                    <li>… y {result.errors.length - 30} más</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => handleOpenChange(false)}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          <Button type="button" disabled={!file || busy} onClick={() => void runImport()} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileUp className="h-3.5 w-3.5" aria-hidden />}
            {busy ? "Importando…" : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
