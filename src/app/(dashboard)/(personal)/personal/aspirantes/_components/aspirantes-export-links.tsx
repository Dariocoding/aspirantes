"use client";

import { ChevronDown, FileDown, FileSpreadsheet, FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { AspirantesExcelColumnsDialog } from "@dashboard/aspirantes/_components/aspirantes-excel-columns-dialog";
import { AspirantesExcelImportDialog } from "@dashboard/aspirantes/_components/aspirantes-excel-import-dialog";
import {
  BoletasPermisoSelectDialog,
  downloadBoletasPermisoPdf,
  type BoletaPersonOption,
} from "@dashboard/aspirantes/_components/boletas-permiso-download";
import { Button } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/components/ui/dropdown-menu";
import { routes } from "@src/lib/apps/routes";
import {
  defaultMembreteOptionId,
  MEMBRETE_NONE_ID,
  type MembreteOption,
} from "@src/lib/membrete";
import Link from "next/link";

type Props = {
  /** Cadena de consulta sin `format` (mismos filtros que el listado). */
  exportQuery: string;
  convocatoriaId: string;
  /** Aspirantes de la convocatoria (sin filtros del listado). */
  convocatoriaCount: number;
  membretes: MembreteOption[];
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

const triggerClass =
  "h-8 gap-1.5 rounded-md px-2.5 text-slate-800 shadow-none hover:bg-slate-100";

export function AspirantesExportLinks({
  exportQuery,
  convocatoriaId,
  convocatoriaCount,
  membretes,
}: Props) {
  const suffix = exportQuery ? `&${exportQuery}` : "";
  const base = "/api/aspirantes/censo/export";
  const [excelOpen, setExcelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [membreteId, setMembreteId] = useState(() => defaultMembreteOptionId(membretes));
  const [boletaPickerOpen, setBoletaPickerOpen] = useState(false);
  const [boletaPeople, setBoletaPeople] = useState<BoletaPersonOption[]>([]);
  const [boletaListLoading, setBoletaListLoading] = useState(false);
  const [boletaPickerError, setBoletaPickerError] = useState<string | null>(null);

  async function runDownload(url: string, fallbackName: string, label: string) {
    if (busyLabel) return;
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

  function exportExcel(columnIds: string[]) {
    const params = new URLSearchParams(exportQuery);
    params.set("format", "xlsx");
    params.set("columns", columnIds.join(","));
    params.set("membrete", membreteId || MEMBRETE_NONE_ID);
    setExcelOpen(false);
    void runDownload(`${base}?${params.toString()}`, "censo-aspirantes.xlsx", "el Excel del censo");
  }

  function membreteQuery() {
    return `membrete=${encodeURIComponent(membreteId || MEMBRETE_NONE_ID)}`;
  }

  const fichasTodasUrl = `${base}?format=pdf&variant=fichas-tecnicas&scope=convocatoria&convocatoria=${encodeURIComponent(convocatoriaId)}`;
  const fichasFiltrosUrl = `${base}?format=pdf&variant=fichas-tecnicas${suffix}`;
  const docsTodasUrl = `${base}?format=pdf&variant=documentos-academicos&scope=convocatoria&convocatoria=${encodeURIComponent(convocatoriaId)}`;
  const docsFiltrosUrl = `${base}?format=pdf&variant=documentos-academicos${suffix}`;
  const boletasBase = "/api/aspirantes/boletas-permiso/pdf";
  const boletasFiltrosUrl = `${boletasBase}?${exportQuery}`;
  const boletasTodasUrl = `${boletasBase}?scope=convocatoria&convocatoria=${encodeURIComponent(convocatoriaId)}`;

  async function openBoletaPicker() {
    setBoletaPickerError(null);
    setBoletaPickerOpen(true);
    setBoletaListLoading(true);
    try {
      const res = await fetch(
        `${boletasBase}?mode=directorio&scope=convocatoria&convocatoria=${encodeURIComponent(convocatoriaId)}`,
        { credentials: "same-origin" },
      );
      const data = (await res.json().catch(() => null)) as
        | { people?: BoletaPersonOption[]; message?: string }
        | null;
      if (!res.ok) throw new Error(data?.message ?? "No se pudo cargar el personal.");
      setBoletaPeople(data?.people ?? []);
    } catch (e) {
      setBoletaPeople([]);
      setBoletaPickerError(e instanceof Error ? e.message : "No se pudo cargar el personal.");
    } finally {
      setBoletaListLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-sm">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={Boolean(busyLabel)}
            render={<Button variant="ghost" size="sm" className={triggerClass} />}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
            Excel
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-64">
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Membrete</DropdownMenuGroupLabel>
              <DropdownMenuCheckboxItem
                checked={membreteId === MEMBRETE_NONE_ID}
                onCheckedChange={(checked) => {
                  if (checked) setMembreteId(MEMBRETE_NONE_ID);
                }}
              >
                Sin membrete
              </DropdownMenuCheckboxItem>
              {membretes.map((m) => (
                <DropdownMenuCheckboxItem
                  key={m.id}
                  checked={membreteId === m.id}
                  onCheckedChange={(checked) => {
                    if (checked) setMembreteId(m.id);
                  }}
                >
                  {m.nombre}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuItem nativeButton={false} render={<Link href={routes.personal.membretes} />}>
                <span className="text-xs text-muted-foreground">Diseñar o editar membretes…</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Hojas de cálculo</DropdownMenuGroupLabel>
              <DropdownMenuItem disabled={Boolean(busyLabel)} onClick={() => setExcelOpen(true)}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Columnas y orden</span>
                  <span className="text-xs text-muted-foreground">Elija qué campos salen y en qué orden</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={Boolean(busyLabel)} onClick={() => setImportOpen(true)}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileUp className="h-3.5 w-3.5 text-emerald-700" aria-hidden />
                    Importar y editar
                  </span>
                  <span className="text-xs text-muted-foreground">Actualiza por cédula las columnas del archivo</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(
                    `${base}?format=xlsx&variant=cumpleanos&${membreteQuery()}${suffix}`,
                    "cumpleanos-aspirantes.xlsx",
                    "el Excel de cumpleaños",
                  )
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Cumpleaños</span>
                  <span className="text-xs text-muted-foreground">Por mes: nombre, cédula, nacimiento y edad</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={Boolean(busyLabel)}
            render={<Button variant="ghost" size="sm" className={triggerClass} />}
          >
            <FileDown className="h-3.5 w-3.5 text-rose-700" aria-hidden />
            PDF
            <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-72">
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Según filtros</DropdownMenuGroupLabel>
              <DropdownMenuItem
                nativeButton={false}
                render={<a href={`${base}?format=pdf${suffix}`} />}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Listado del censo</span>
                  <span className="text-xs text-muted-foreground">Directorio en PDF</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(fichasFiltrosUrl, "fichas-tecnicas.pdf", "fichas con los filtros actuales")
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Fichas técnicas</span>
                  <span className="text-xs text-muted-foreground">Una ficha por aspirante visible</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(
                    docsFiltrosUrl,
                    "documentos-academicos.pdf",
                    "documentos académicos con los filtros actuales",
                  )
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Documentos académicos</span>
                  <span className="text-xs text-muted-foreground">Fondo, autenticación y notas</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(boletasFiltrosUrl, "boletas-permiso.pdf", "boletas con los filtros actuales")
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Boletas de permiso</span>
                  <span className="text-xs text-muted-foreground">Carnet en PDF, personal visible</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Toda la convocatoria</DropdownMenuGroupLabel>
              <DropdownMenuItem
                disabled={convocatoriaCount < 1 || Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(fichasTodasUrl, "fichas-tecnicas.pdf", "todas las fichas técnicas")
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">
                    Fichas técnicas
                    {convocatoriaCount > 0 ? (
                      <span className="ml-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                        {convocatoriaCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">Todas las fichas de la convocatoria</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={convocatoriaCount < 1 || Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(
                    docsTodasUrl,
                    "documentos-academicos.pdf",
                    "documentos académicos de toda la convocatoria",
                  )
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Documentos académicos</span>
                  <span className="text-xs text-muted-foreground">El mismo formato, todos los registros</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={convocatoriaCount < 1 || Boolean(busyLabel)}
                onClick={() =>
                  void runDownload(boletasTodasUrl, "boletas-permiso.pdf", "boletas de toda la convocatoria")
                }
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">
                    Boletas de permiso
                    {convocatoriaCount > 0 ? (
                      <span className="ml-1.5 text-xs font-semibold tabular-nums text-muted-foreground">
                        {convocatoriaCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">Todas las de la convocatoria</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={convocatoriaCount < 1 || Boolean(busyLabel)} onClick={() => void openBoletaPicker()}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">Elegir personal</span>
                  <span className="text-xs text-muted-foreground">Marque quiénes descargan boleta</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error ? (
        <p className="basis-full text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <AspirantesExcelColumnsDialog
        open={excelOpen}
        onOpenChange={setExcelOpen}
        busy={Boolean(busyLabel)}
        membretes={membretes}
        membreteId={membreteId}
        onMembreteIdChange={setMembreteId}
        onExport={exportExcel}
      />
      <AspirantesExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        convocatoriaId={convocatoriaId}
      />

      <BoletasPermisoSelectDialog
        open={boletaPickerOpen}
        onOpenChange={setBoletaPickerOpen}
        people={boletaPeople}
        loading={boletaListLoading}
        busy={Boolean(busyLabel)}
        error={boletaPickerError}
        onDownload={(ids) => {
          setBoletaPickerOpen(false);
          if (busyLabel) return;
          setError(null);
          setBusyLabel("las boletas seleccionadas");
          void downloadBoletasPermisoPdf({ ids, fallbackName: "boletas-permiso.pdf" })
            .catch((e) => setError(e instanceof Error ? e.message : "No se pudo generar el archivo."))
            .finally(() => setBusyLabel(null));
        }}
      />

      <Dialog open={Boolean(busyLabel)} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader className="border-0">
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-800" aria-hidden />
              Generando archivo
            </DialogTitle>
            <DialogDescription className="text-left">
              Se están armando {busyLabel}. No cierre esta ventana; con muchos aspirantes puede tardar
              varios minutos.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
