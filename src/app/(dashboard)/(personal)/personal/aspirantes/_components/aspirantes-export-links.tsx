"use client";

import { ChevronDown, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { cn } from "@src/lib/utils";

type Props = {
  /** Cadena de consulta sin `format` (mismos filtros que el listado). */
  exportQuery: string;
  convocatoriaId: string;
  /** Aspirantes de la convocatoria (sin filtros del listado). */
  convocatoriaCount: number;
};

function filenameFromContentDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      return star[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  if (plain?.[1]) return plain[1].trim().replace(/^"+|"+$/g, "");
  return fallback;
}

async function downloadExport(url: string, fallbackName: string) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `No se pudo generar el archivo (${res.status}).`);
  }
  const blob = await res.blob();
  const filename = filenameFromContentDisposition(res.headers.get("Content-Disposition"), fallbackName);
  const href = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(href);
  }
}

export function AspirantesExportLinks({ exportQuery, convocatoriaId, convocatoriaCount }: Props) {
  const suffix = exportQuery ? `&${exportQuery}` : "";
  const base = "/api/aspirantes/censo/export";
  const excelRef = useRef<HTMLDetailsElement>(null);
  const pdfRef = useRef<HTMLDetailsElement>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function closeMenus() {
    if (excelRef.current) excelRef.current.open = false;
    if (pdfRef.current) pdfRef.current.open = false;
  }

  async function runDownload(url: string, fallbackName: string, label: string) {
    if (busyLabel) return;
    closeMenus();
    setError(null);
    setBusyLabel(label);
    try {
      await downloadExport(url, fallbackName);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el archivo.");
    } finally {
      setBusyLabel(null);
    }
  }

  const fichasTodasUrl = `${base}?format=pdf&variant=fichas-tecnicas&scope=convocatoria&convocatoria=${encodeURIComponent(convocatoriaId)}`;
  const fichasFiltrosUrl = `${base}?format=pdf&variant=fichas-tecnicas${suffix}`;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <details ref={excelRef} className="group relative">
        <summary
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 cursor-pointer list-none gap-1.5 border-emerald-200/90 bg-emerald-50/80 px-2.5 text-emerald-950 shadow-sm hover:bg-emerald-100/90 [&::-webkit-details-marker]:hidden",
          )}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
          Excel
          <ChevronDown className="h-3.5 w-3.5 opacity-70 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div
          className="absolute right-0 z-30 mt-1.5 w-64 overflow-hidden rounded-lg border border-emerald-200/90 bg-white py-1 shadow-lg shadow-slate-900/10"
          role="menu"
        >
          <a
            href={`${base}?format=xlsx${suffix}`}
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenus}
          >
            <span className="font-medium">Censo completo</span>
            <span className="mt-0.5 block text-xs text-slate-500">Exportación habitual del directorio</span>
          </a>
          <a
            href={`${base}?format=xlsx&variant=examenes-medicos${suffix}`}
            role="menuitem"
            className="block border-t border-slate-100 px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenus}
          >
            <span className="font-medium">Exámenes médicos</span>
            <span className="mt-0.5 block text-xs text-slate-500">Nombre, cédula y checklist médico</span>
          </a>
          <a
            href={`${base}?format=xlsx&variant=lista-oficial${suffix}`}
            role="menuitem"
            className="block border-t border-slate-100 px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenus}
          >
            <span className="font-medium">Lista oficial</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              N°, JQUIA ASP OFICIAL, apellidos, nombres, cédula, sexo
            </span>
          </a>
          <a
            href={`${base}?format=xlsx&variant=cumpleanos${suffix}`}
            role="menuitem"
            className="block border-t border-slate-100 px-3 py-2 text-sm text-slate-800 hover:bg-emerald-50"
            onClick={closeMenus}
          >
            <span className="font-medium">Cumpleaños</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Por mes: nombre, cédula, fecha de nacimiento y edad
            </span>
          </a>
        </div>
      </details>
      <details ref={pdfRef} className="group relative">
        <summary
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 cursor-pointer list-none gap-1.5 border-rose-200/90 bg-rose-50/80 px-2.5 text-rose-950 shadow-sm hover:bg-rose-100/90 [&::-webkit-details-marker]:hidden",
          )}
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden />
          PDF
          <ChevronDown className="h-3.5 w-3.5 opacity-70 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div
          className="absolute right-0 z-30 mt-1.5 w-72 overflow-hidden rounded-lg border border-rose-200/90 bg-white py-1 shadow-lg shadow-slate-900/10"
          role="menu"
        >
          <a
            href={`${base}?format=pdf${suffix}`}
            role="menuitem"
            className="block px-3 py-2 text-sm text-slate-800 hover:bg-rose-50"
            onClick={closeMenus}
          >
            <span className="font-medium">Listado del censo</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Directorio en PDF según los filtros actuales
            </span>
          </a>
          <button
            type="button"
            role="menuitem"
            className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-800 hover:bg-rose-50"
            onClick={() =>
              void runDownload(fichasFiltrosUrl, "fichas-tecnicas.pdf", "fichas con los filtros actuales")
            }
          >
            <span className="font-medium">Fichas técnicas (filtros)</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Un PDF con una ficha por aspirante visible con los filtros
            </span>
          </button>
        </div>
      </details>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={convocatoriaCount < 1 || Boolean(busyLabel)}
        className="h-9 gap-1.5 border-indigo-200/90 bg-indigo-50/80 px-2.5 text-indigo-950 shadow-sm hover:bg-indigo-100/90"
        onClick={() =>
          void runDownload(fichasTodasUrl, "fichas-tecnicas.pdf", "todas las fichas técnicas")
        }
      >
        {busyLabel ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <FileDown className="h-3.5 w-3.5" aria-hidden />
        )}
        Todas las fichas
        {convocatoriaCount > 0 ? (
          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-indigo-900">
            {convocatoriaCount}
          </span>
        ) : null}
      </Button>
      {error ? (
        <p className="basis-full text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <Dialog open={Boolean(busyLabel)} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader className="border-0">
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-800" aria-hidden />
              Generando PDF
            </DialogTitle>
            <DialogDescription className="text-left">
              Se están armando {busyLabel}. No cierre esta ventana; con muchos aspirantes puede tardar
              varios minutos.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
