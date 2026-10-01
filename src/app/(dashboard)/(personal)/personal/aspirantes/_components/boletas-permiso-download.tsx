"use client";

import { FileBadge, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, buttonVariants } from "@src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import { Input } from "@src/components/ui/input";
import { formatCedulaMillares } from "@src/lib/aspirantes/cedula";
import { foldBusqueda } from "@src/lib/text/fold";
import { cn } from "@src/lib/utils";

export type BoletaPersonOption = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
};

export function aspiranteBoletaPermisoPdfUrl(aspiranteId: string): string {
  return `/api/aspirantes/boletas-permiso/pdf?ids=${encodeURIComponent(aspiranteId)}`;
}

export function boletasPermisoPdfUrl(input: { ids?: string[]; url?: string }): string {
  if (input.ids?.length) {
    return `/api/aspirantes/boletas-permiso/pdf?ids=${input.ids.map((id) => encodeURIComponent(id)).join(",")}`;
  }
  return input.url ?? "/api/aspirantes/boletas-permiso/pdf";
}

export function openBoletasPermisoPdf(input: { ids?: string[]; url?: string }) {
  window.open(boletasPermisoPdfUrl(input), "_blank", "noopener,noreferrer");
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
  return (
    <a
      href={aspiranteBoletaPermisoPdfUrl(aspiranteId)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size }),
        "gap-1.5 border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <FileBadge className="h-3.5 w-3.5" aria-hidden />
      {label}
    </a>
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
    const n = foldBusqueda(q.trim());
    if (!n) return people;
    return people.filter((p) =>
      foldBusqueda(`${p.nombres} ${p.apellidos} ${p.cedula} ${formatCedulaMillares(p.cedula)}`).includes(n),
    );
  }, [people, q]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ver boletas de permiso</DialogTitle>
          <DialogDescription>
            Marque el personal. El PDF se abre en el navegador (carta, dos boletas por hoja); el serial sigue el orden de la convocatoria.
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
                        <span className="block font-mono text-[11px] text-slate-500">{formatCedulaMillares(p.cedula)}</span>
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
            {busy ? "Abriendo…" : `Ver PDF${selected.size ? ` (${selected.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
