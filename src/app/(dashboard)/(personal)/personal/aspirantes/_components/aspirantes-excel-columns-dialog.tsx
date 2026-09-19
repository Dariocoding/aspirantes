"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Columns3, FileSpreadsheet, GripVertical, RotateCcw, Search } from "lucide-react";
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
import { routes } from "@src/lib/apps/routes";
import {
  CENSUS_EXPORT_COLUMN_GROUPS,
  CENSUS_EXPORT_COLUMNS,
  CENSUS_EXPORT_DEFAULT_IDS,
  getCensusExportColumn,
  moveCensusExportColumn,
} from "@src/lib/aspirantes/census-export-columns";
import {
  defaultMembreteOptionId,
  MEMBRETE_NONE_ID,
  type MembreteOption,
} from "@src/lib/membrete";
import { cn } from "@src/lib/utils";
import Link from "next/link";

const REQUIRED_EXPORT_IDS = new Set<string>(CENSUS_EXPORT_DEFAULT_IDS);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  membretes: MembreteOption[];
  membreteId: string;
  onMembreteIdChange: (id: string) => void;
  onExport: (columnIds: string[]) => void;
};

export function AspirantesExcelColumnsDialog({
  open,
  onOpenChange,
  busy,
  membretes,
  membreteId,
  onMembreteIdChange,
  onExport,
}: Props) {
  const [ids, setIds] = useState<string[]>([...CENSUS_EXPORT_DEFAULT_IDS]);
  const [query, setQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setIds([...CENSUS_EXPORT_DEFAULT_IDS]);
      setQuery("");
    }
    onOpenChange(next);
  }

  const selectedSet = useMemo(() => new Set(ids), [ids]);
  const selectedColumns = useMemo(
    () => ids.map((id) => getCensusExportColumn(id)).filter((c) => c != null),
    [ids],
  );

  const q = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    return CENSUS_EXPORT_COLUMN_GROUPS.map((group) => ({
      group,
      columns: CENSUS_EXPORT_COLUMNS.filter((c) => {
        if (c.group !== group) return false;
        if (!q) return true;
        return c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      }),
    })).filter((g) => g.columns.length > 0);
  }, [q]);

  function toggle(id: string, checked: boolean) {
    if (!checked && REQUIRED_EXPORT_IDS.has(id)) return;
    setIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-emerald-700" aria-hidden />
            Exportar Excel
          </DialogTitle>
          <DialogDescription>
            N°, nombre completo y cédula salen siempre. Elija el membrete institucional y el resto de
            columnas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3 px-5 pt-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="excel-membrete" className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Membrete
            </label>
            <select
              id="excel-membrete"
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={membreteId || defaultMembreteOptionId(membretes)}
              onChange={(e) => onMembreteIdChange(e.target.value)}
            >
              <option value={MEMBRETE_NONE_ID}>Sin membrete (solo título actual)</option>
              {membretes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                  {m.isDefault ? " (predeterminado)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Link
            href={routes.personal.membretes}
            className="mb-0.5 text-xs font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
          >
            Diseñar membretes
          </Link>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 border-t border-border md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]">
          <div className="flex min-h-0 flex-col border-b border-border md:border-r md:border-b-0">
            <div className="px-5 py-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar columna…"
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <div className="min-h-0 max-h-[min(52vh,420px)] overflow-y-auto px-3 pb-3">
              {filteredGroups.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">Ninguna columna coincide.</p>
              ) : (
                filteredGroups.map(({ group, columns }) => (
                  <section key={group} className="mb-3">
                    <h3 className="sticky top-0 z-10 bg-popover px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      {group}
                    </h3>
                    <ul className="space-y-0.5">
                      {columns.map((col) => {
                        const checked = selectedSet.has(col.id);
                        const required = REQUIRED_EXPORT_IDS.has(col.id);
                        return (
                          <li key={col.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100",
                                checked && "bg-emerald-50/80 hover:bg-emerald-50",
                                required && "cursor-default",
                              )}
                            >
                              <input
                                type="checkbox"
                                className="size-3.5 shrink-0 accent-emerald-700 disabled:opacity-80"
                                checked={checked}
                                disabled={required}
                                onChange={(e) => toggle(col.id, e.target.checked)}
                              />
                              <span className="min-w-0 leading-snug text-slate-800">{col.label}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col bg-slate-50/70">
            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
                Orden en el archivo
                <span className="ml-1.5 tabular-nums text-slate-400">{selectedColumns.length}</span>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setIds([...CENSUS_EXPORT_DEFAULT_IDS])}
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                Reiniciar
              </Button>
            </div>
            <ol className="min-h-0 max-h-[min(52vh,420px)] flex-1 space-y-1 overflow-y-auto px-3 pb-3">
              {selectedColumns.map((col, index) => (
                <li
                  key={col.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex == null) return;
                    setIds((prev) => moveCensusExportColumn(prev, dragIndex, index));
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    "flex items-center gap-1 rounded-md border border-slate-200/90 bg-white px-1.5 py-1 shadow-xs",
                    dragIndex === index && "opacity-50",
                  )}
                >
                  <span className="flex size-6 shrink-0 cursor-grab items-center justify-center text-slate-400 active:cursor-grabbing">
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="w-5 shrink-0 text-center text-[11px] font-semibold tabular-nums text-slate-400">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{col.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-slate-500"
                    disabled={index === 0}
                    aria-label={`Subir ${col.label}`}
                    onClick={() => setIds((prev) => moveCensusExportColumn(prev, index, index - 1))}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-slate-500"
                    disabled={index === selectedColumns.length - 1}
                    aria-label={`Bajar ${col.label}`}
                    onClick={() => setIds((prev) => moveCensusExportColumn(prev, index, index + 1))}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <p className="self-center text-xs text-slate-500">
            Se exportan los registros que coinciden con los filtros actuales.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!ids.length || busy}
              onClick={() => onExport(ids)}
              className="gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
              Descargar Excel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
