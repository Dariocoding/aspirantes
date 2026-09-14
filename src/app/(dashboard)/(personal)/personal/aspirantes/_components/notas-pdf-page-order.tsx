"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, LoaderCircle } from "lucide-react";
import { Button } from "@src/components/ui/button";
import {
  fetchPdfAsFile,
  renderPdfPageThumbs,
  reorderPdfFile,
  type PdfPageThumb,
} from "@src/lib/storage/compress-pdf-client";
import { cn } from "@src/lib/utils";

type PageItem = PdfPageThumb & { id: string };

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (!item) return list;
  next.splice(to, 0, item);
  return next;
}

function orderUnchanged(pages: PageItem[]): boolean {
  return pages.every((page, index) => page.sourceIndex === index);
}

export function NotasPdfPageOrder({
  sourceUrl,
  sourceFile,
  disabled = false,
  onConfirm,
  onCancel,
  confirmLabel = "Guardar orden",
}: {
  sourceUrl?: string | null;
  sourceFile?: File | null;
  disabled?: boolean;
  onConfirm: (file: File) => void;
  onCancel: () => void;
  confirmLabel?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const fileRef = useRef<File | null>(null);
  const dragFrom = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPages([]);

    void (async () => {
      try {
        const file =
          sourceFile ??
          (sourceUrl ? await fetchPdfAsFile(sourceUrl, "notas.pdf") : null);
        if (!file) {
          throw new Error("No hay un PDF para ordenar.");
        }
        fileRef.current = file;
        const thumbs = await renderPdfPageThumbs(new Uint8Array(await file.arrayBuffer()));
        if (cancelled) return;
        setPages(
          thumbs.map((thumb) => ({
            ...thumb,
            id: `p-${thumb.sourceIndex}`,
          })),
        );
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "No se pudieron leer las páginas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceFile, sourceUrl]);

  const onDropAt = useCallback((to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from == null) return;
    setPages((prev) => moveItem(prev, from, to));
  }, []);

  const save = useCallback(async () => {
    const file = fileRef.current;
    if (!file || pages.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const next = await reorderPdfFile(
        file,
        pages.map((page) => page.sourceIndex),
      );
      onConfirm(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el orden.");
    } finally {
      setSaving(false);
    }
  }, [onConfirm, pages]);

  const busy = disabled || loading || saving;
  const dirty = pages.length > 1 && !orderUnchanged(pages);

  return (
    <div className="flex w-full flex-col gap-3">
      {loading ? (
        <div className="flex min-h-[12rem] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-700" aria-hidden />
          <span className="sr-only">Leyendo páginas del PDF</span>
        </div>
      ) : pages.length <= 1 ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-4 text-center text-sm text-slate-600">
          Este PDF tiene una sola página; no hay nada que reordenar.
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Arrastre las miniaturas o use las flechas. El 1 queda al inicio del PDF.
          </p>
          <ol className="flex max-h-[min(48vh,22rem)] flex-wrap gap-2 overflow-y-auto">
            {pages.map((page, index) => (
              <li
                key={page.id}
                draggable={!busy}
                onDragStart={() => {
                  dragFrom.current = index;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  onDropAt(index);
                }}
                className={cn(
                  "flex w-[7.25rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs",
                  !busy && "cursor-grab active:cursor-grabbing",
                )}
              >
                <div className="flex items-center justify-between gap-1 border-b border-slate-100 bg-slate-50 px-1.5 py-1">
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-700">
                    <GripVertical className="h-3 w-3 text-slate-400" aria-hidden />
                    {index + 1}
                  </span>
                  <span className="flex">
                    <button
                      type="button"
                      className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
                      disabled={busy || index === 0}
                      aria-label={`Subir página ${index + 1}`}
                      onClick={() => setPages((prev) => moveItem(prev, index, index - 1))}
                    >
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
                      disabled={busy || index === pages.length - 1}
                      aria-label={`Bajar página ${index + 1}`}
                      onClick={() => setPages((prev) => moveItem(prev, index, index + 1))}
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura rasterizada en el cliente */}
                <img
                  src={page.dataUrl}
                  alt={`Página ${index + 1}`}
                  className="h-28 w-full bg-slate-100 object-contain"
                  draggable={false}
                />
              </li>
            ))}
          </ol>
        </>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
        {pages.length > 1 ? (
          <Button
            type="button"
            size="sm"
            className="bg-slate-900 hover:bg-slate-800"
            disabled={busy || !dirty}
            onClick={() => void save()}
          >
            {saving ? (
              <>
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Guardando
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
