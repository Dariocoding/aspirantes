"use client";

import { FileBadge, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { cn } from "@src/lib/utils";

export type BoletaPersonOption = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
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

async function saveBlob(res: Response, fallbackName: string) {
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

export function aspiranteBoletaPermisoPdfUrl(aspiranteId: string): string {
  return `/api/aspirantes/boletas-permiso/pdf?ids=${encodeURIComponent(aspiranteId)}`;
}

export async function downloadBoletasPermisoPdf(input: {
  ids?: string[];
  url?: string;
  fallbackName?: string;
}): Promise<void> {
  const res = input.ids?.length
    ? await fetch("/api/aspirantes/boletas-permiso/pdf", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: input.ids }),
      })
    : await fetch(input.url ?? "/api/aspirantes/boletas-permiso/pdf", { credentials: "same-origin" });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(data?.message ?? `No se pudo generar el Word (${res.status}).`);
  }
  await saveBlob(res, input.fallbackName ?? "boletas-permiso.docx");
}

export function AspiranteBoletaPermisoPdfLink({
  aspiranteId,
  className,
  size = "sm",
  label = "Boleta de permiso",
}: {
  aspiranteId: string;
  className?: string;
  size?: "sm" | "default";
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={busy}
        className={cn("gap-1.5 border-slate-200 bg-white shadow-sm", className)}
        onClick={() => {
          if (busy) return;
          setError(null);
          setBusy(true);
          void downloadBoletasPermisoPdf({
            ids: [aspiranteId],
            fallbackName: "boleta-permiso.docx",
          })
            .catch((e) => setError(e instanceof Error ? e.message : "No se pudo descargar."))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileBadge className="h-3.5 w-3.5" aria-hidden />}
        {busy ? "Generando…" : label}
      </Button>
      {error ? (
        <span className="text-[11px] text-rose-700" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}

export function BoletasPermisoSelectDialog({
  open,
  onOpenChange,
  people,
  loading,
  busy,
  error,
  onDownload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: BoletaPersonOption[];
  loading?: boolean;
  busy?: boolean;
  error?: string | null;
  onDownload: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const n = q.trim().toLocaleLowerCase("es");
    if (!n) return people;
    return people.filter((p) =>
      `${p.nombres} ${p.apellidos} ${p.cedula}`.toLocaleLowerCase("es").includes(n),
    );
  }, [people, q]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Descargar boletas de permiso</DialogTitle>
          <DialogDescription>
            Marque el personal. Se descarga un Word con frente y reverso; el serial sigue el orden de la convocatoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-5 pb-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o cédula"
            aria-label="Buscar personal"
          />
          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={() => {
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (allVisibleSelected) {
                      for (const p of filtered) next.delete(p.id);
                    } else {
                      for (const p of filtered) next.add(p.id);
                    }
                    return next;
                  });
                }}
              />
              Seleccionar visibles
            </label>
            <span className="tabular-nums">{selected.size} elegidos</span>
          </div>
          <div className="max-h-72 overflow-auto rounded-md border border-slate-200">
            {loading ? (
              <p className="flex items-center gap-2 px-3 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Cargando personal…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">No hay coincidencias.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.has(p.id)}
                        onChange={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(p.id)) next.delete(p.id);
                            else next.add(p.id);
                            return next;
                          });
                        }}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">
                          {p.apellidos}, {p.nombres}
                        </span>
                        <span className="block font-mono text-[11px] text-slate-500">{p.cedula}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error ? (
            <p className="text-xs text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={busy || selected.size < 1}
            onClick={() => onDownload([...selected])}
          >
            {busy ? "Generando…" : `Descargar ${selected.size || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
