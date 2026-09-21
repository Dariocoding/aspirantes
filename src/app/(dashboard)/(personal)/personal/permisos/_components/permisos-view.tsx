"use client";

import { Ban, CalendarClock, Clock3, FileBadge } from "lucide-react";
import { useMemo, useState } from "react";
import { AspiranteIdentityLink } from "@dashboard/aspirantes/_components/aspirante-foto";
import {
  aspiranteBoletaPermisoPdfUrl,
  BoletasPermisoSelectDialog,
  downloadBoletasPermisoPdf,
} from "@dashboard/aspirantes/_components/boletas-permiso-download";
import {
  PermisoAnularDialog,
  PermisoCreateDialog,
  PermisoEditDialog,
  PermisoEditTriggerButton,
  type PermisoAspiranteOption,
  type PermisoRow,
} from "./permiso-modals";
import { Button } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/components/ui/table";
import { formatDateTime } from "@src/lib/date";
import {
  estadoPermiso,
  formatDuracionPermiso,
  labelTipoPermiso,
  PERMISO_ESTADO_LABEL,
  PERMISO_TIPO_OPCIONES,
  permisoEstadoBadgeClass,
  type EstadoPermiso,
} from "@src/lib/permisos";
import { cn } from "@src/lib/utils";

export type PermisoListItem = PermisoRow & {
  nombres: string;
  apellidos: string;
  cedula: string;
  fotoKey: string | null;
};

type FilterEstado = "TODOS" | EstadoPermiso;

type Props = {
  canWrite: boolean;
  aspirantes: PermisoAspiranteOption[];
  permisos: PermisoListItem[];
  defaultAspiranteId?: string;
};

export function PermisosView({ canWrite, aspirantes, permisos, defaultAspiranteId }: Props) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<FilterEstado>("TODOS");
  const [tipo, setTipo] = useState<string>("TODOS");
  const [editItem, setEditItem] = useState<PermisoRow | null>(null);
  const [anularItem, setAnularItem] = useState<PermisoRow | null>(null);
  const [boletaPickerOpen, setBoletaPickerOpen] = useState(false);
  const [boletaBusy, setBoletaBusy] = useState(false);
  const [boletaError, setBoletaError] = useState<string | null>(null);

  const enriched = useMemo(
    () =>
      permisos.map((p) => ({
        ...p,
        estado: estadoPermiso({
          fechaInicio: new Date(p.fechaInicioIso),
          fechaFin: new Date(p.fechaFinIso),
          anulado: p.anulado,
        }),
      })),
    [permisos],
  );

  const counts = useMemo(() => {
    const base = { VIGENTE: 0, PROGRAMADO: 0, FINALIZADO: 0, ANULADO: 0 };
    for (const p of enriched) base[p.estado] += 1;
    return base;
  }, [enriched]);

  const filtered = useMemo(() => {
    const n = q.trim().toLocaleLowerCase("es");
    return enriched.filter((p) => {
      if (estado !== "TODOS" && p.estado !== estado) return false;
      if (tipo !== "TODOS" && p.tipo !== tipo) return false;
      if (!n) return true;
      return `${p.nombres} ${p.apellidos} ${p.cedula} ${p.motivo} ${p.destino ?? ""}`
        .toLocaleLowerCase("es")
        .includes(n);
    });
  }, [enriched, estado, tipo, q]);

  const colSpan = canWrite ? 8 : 7;

  return (
    <div className="space-y-5">
      <PermisoEditDialog
        item={editItem}
        aspirantes={aspirantes}
        open={Boolean(editItem)}
        onOpenChange={(open: boolean) => {
          if (!open) setEditItem(null);
        }}
      />
      <PermisoAnularDialog
        item={anularItem}
        open={Boolean(anularItem)}
        onOpenChange={(open: boolean) => {
          if (!open) setAnularItem(null);
        }}
      />

      <BoletasPermisoSelectDialog
        open={boletaPickerOpen}
        onOpenChange={setBoletaPickerOpen}
        people={aspirantes}
        busy={boletaBusy}
        error={boletaError}
        onDownload={(ids) => {
          setBoletaPickerOpen(false);
          setBoletaError(null);
          setBoletaBusy(true);
          void downloadBoletasPermisoPdf({ ids, fallbackName: "boletas-permiso.docx" })
            .catch((e) => setBoletaError(e instanceof Error ? e.message : "No se pudo generar el Word."))
            .finally(() => setBoletaBusy(false));
        }}
      />

      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-2.5">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden />
              <div className="min-w-0 space-y-0.5">
                <CardTitle className="text-base font-semibold text-slate-900">Control de permisos</CardTitle>
                <CardDescription className="text-xs leading-snug text-slate-600">
                  Un registro por persona: de cuándo a cuándo está autorizado a ausentarse.
                  <span className="text-slate-400"> · </span>
                  <span className="font-medium tabular-nums text-slate-800">{counts.VIGENTE}</span> vigentes
                  {boletaError ? (
                    <>
                      <span className="text-slate-400"> · </span>
                      <span className="text-rose-700">{boletaError}</span>
                    </>
                  ) : null}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canWrite ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    disabled={boletaBusy || aspirantes.length < 1}
                    onClick={() => {
                      setBoletaError(null);
                      setBoletaBusy(true);
                      void downloadBoletasPermisoPdf({
                        ids: aspirantes.map((a) => a.id),
                        fallbackName: "boletas-permiso.docx",
                      })
                        .catch((e) =>
                          setBoletaError(e instanceof Error ? e.message : "No se pudo generar el Word."),
                        )
                        .finally(() => setBoletaBusy(false));
                    }}
                  >
                    <FileBadge className="h-3.5 w-3.5" aria-hidden />
                    {boletaBusy ? "Generando…" : "Boletas (todas)"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    disabled={boletaBusy || aspirantes.length < 1}
                    onClick={() => {
                      setBoletaError(null);
                      setBoletaPickerOpen(true);
                    }}
                  >
                    Elegir personal
                  </Button>
                </>
              ) : null}
              <PermisoCreateDialog
                canWrite={canWrite}
                aspirantes={aspirantes}
                defaultAspiranteId={defaultAspiranteId}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-px bg-slate-200 p-0 sm:grid-cols-4">
          {(
            [
              ["VIGENTE", counts.VIGENTE],
              ["PROGRAMADO", counts.PROGRAMADO],
              ["FINALIZADO", counts.FINALIZADO],
              ["ANULADO", counts.ANULADO],
            ] as const
          ).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setEstado((prev) => (prev === key ? "TODOS" : key))}
              className={cn(
                "bg-white px-3 py-2.5 text-left transition-colors hover:bg-slate-50",
                estado === key && "ring-2 ring-inset ring-slate-900/10",
              )}
            >
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                {PERMISO_ESTADO_LABEL[key]}
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label htmlFor="perm-q" className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Buscar
              </label>
              <Input
                id="perm-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, cédula, motivo o destino"
              />
            </div>
            <div className="w-full sm:w-44">
              <label htmlFor="perm-tipo" className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Tipo
              </label>
              <select
                id="perm-tipo"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                {PERMISO_TIPO_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personal</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Boleta</TableHead>
                {canWrite ? <TableHead className="text-right">Acciones</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-slate-500">
                    No hay permisos con esos filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const inicio = new Date(p.fechaInicioIso);
                  const fin = new Date(p.fechaFinIso);
                  const nombre = `${p.nombres} ${p.apellidos}`;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <AspiranteIdentityLink
                          aspiranteId={p.aspiranteId}
                          fotoKey={p.fotoKey}
                          nombre={nombre}
                          size="sm"
                        >
                          <span className="block font-mono text-[11px] text-slate-500">{p.cedula}</span>
                          {p.motivo ? (
                            <span className="mt-0.5 block max-w-56 truncate text-[11px] text-slate-500">
                              {p.motivo}
                            </span>
                          ) : null}
                        </AspiranteIdentityLink>
                      </TableCell>
                      <TableCell className="text-sm">{labelTipoPermiso(p.tipo)}</TableCell>
                      <TableCell className="text-xs tabular-nums text-slate-700">
                        {formatDateTime(inicio)}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums text-slate-700">{formatDateTime(fin)}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" aria-hidden />
                          {formatDuracionPermiso(inicio, fin)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                            permisoEstadoBadgeClass(p.estado),
                          )}
                        >
                          {PERMISO_ESTADO_LABEL[p.estado]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={aspiranteBoletaPermisoPdfUrl(p.aspiranteId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50",
                          )}
                        >
                          <FileBadge className="h-3.5 w-3.5" aria-hidden />
                          Word
                        </a>
                      </TableCell>
                      {canWrite ? (
                        <TableCell className="text-right">
                          {p.anulado ? null : (
                            <div className="flex justify-end gap-1.5">
                              <PermisoEditTriggerButton onClick={() => setEditItem(p)} />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-rose-800"
                                onClick={() => setAnularItem(p)}
                              >
                                <Ban className="h-3.5 w-3.5" aria-hidden />
                                Anular
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
