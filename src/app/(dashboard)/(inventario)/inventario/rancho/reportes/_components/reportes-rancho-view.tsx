"use client";

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FileDown,
  FileText,
  Save,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { generarReporteRancho } from "@src/app/actions/inventario-reporte-rancho";
import { DeleteReporteButton } from "@dashboard/inventario/rancho/reportes/_components/delete-reporte-button";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Label } from "@src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/components/ui/table";
import { Textarea } from "@src/components/ui/textarea";
import { SuccessCelebrationDialog } from "@src/components/ui/success-celebration-dialog";
import { useCelebrateOnOkTransition } from "@src/hooks/use-celebrate-on-ok-transition";
import { inventarioInitialActionState } from "@src/lib/action-types";
import { routes } from "@src/lib/apps/routes";
import { formatCantidad, labelUnidad } from "@src/lib/inventario/area";
import {
  REPORTE_ESTADO_DESCRIPTIONS,
  REPORTE_ESTADO_LABELS,
  REPORTE_RANCHO_ESTADOS,
  resumirReporteLineas,
  type FechaReporteOption,
  type ReporteRanchoDatos,
  type ReporteRanchoEstado,
  type ReporteRanchoMovimiento,
  type ReporteRanchoPreviewLinea,
} from "@src/lib/inventario/reporte-rancho";
import { cn } from "@src/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type ReporteRanchoListRow = {
  id: string;
  fecha: Date;
  notas: string | null;
  createdAt: Date;
  user: { name: string | null; email: string | null };
  lineas: { estado: ReporteRanchoEstado }[];
};

export type ReporteRanchoDetalle = {
  id: string;
  fecha: Date;
  notas: string | null;
  createdAt: Date;
  user: { name: string | null; email: string | null };
  lineas: ReporteRanchoPreviewLinea[];
  movimientos: ReporteRanchoMovimiento[];
};

type Props = {
  previewsByFecha: Record<string, ReporteRanchoDatos>;
  fechas: FechaReporteOption[];
  reportes: ReporteRanchoListRow[];
  detalle: ReporteRanchoDetalle | null;
  canWrite: boolean;
  canDeleteReportes: boolean;
};

const ESTADO_STYLES: Record<
  ReporteRanchoEstado,
  { badge: string; icon: typeof CheckCircle2; header: string }
> = {
  QUEDA: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
    header: "border-emerald-200/80 bg-emerald-50/60",
  },
  FALTA: {
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    icon: AlertTriangle,
    header: "border-amber-200/80 bg-amber-50/60",
  },
  NO_HAY: {
    badge: "border-red-200 bg-red-50 text-red-800",
    icon: XCircle,
    header: "border-red-200/80 bg-red-50/60",
  },
};

function ResumenEstados({ resumen }: { resumen: ReturnType<typeof resumirReporteLineas> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {REPORTE_RANCHO_ESTADOS.map((estado) => {
        const style = ESTADO_STYLES[estado];
        const Icon = style.icon;
        return (
          <div key={estado} className={cn("rounded-lg border px-3 py-2.5", style.header)}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide">{REPORTE_ESTADO_LABELS[estado]}</p>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{resumen[estado]}</p>
            <p className="mt-0.5 text-[11px] leading-snug opacity-80">{REPORTE_ESTADO_DESCRIPTIONS[estado]}</p>
          </div>
        );
      })}
    </div>
  );
}

function ExistenciasTable({ lineas }: { lineas: ReporteRanchoPreviewLinea[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Ítem</TableHead>
            <TableHead className="text-right">Existía ayer</TableHead>
            <TableHead className="text-right">Entradas</TableHead>
            <TableHead className="text-right">Salidas</TableHead>
            <TableHead className="text-right">Al reportar</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineas.map((item) => (
            <TableRow key={item.itemId}>
              <TableCell className="font-medium">{item.nombre}</TableCell>
              <TableCell className="text-right tabular-nums text-slate-600">
                {formatCantidad(item.stockAyer, labelUnidad(item.unidad))}
              </TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700">
                {item.entradas > 0 ? formatCantidad(item.entradas, labelUnidad(item.unidad)) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums text-orange-700">
                {item.salidas > 0 ? formatCantidad(item.salidas, labelUnidad(item.unidad)) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatCantidad(item.stockReportado, labelUnidad(item.unidad))}
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    ESTADO_STYLES[item.estado].badge,
                  )}
                >
                  {REPORTE_ESTADO_LABELS[item.estado]}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MovimientosDelDia({ movimientos }: { movimientos: ReporteRanchoMovimiento[] }) {
  if (movimientos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
        Sin movimientos registrados en este día.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Hora</TableHead>
            <TableHead>Ítem</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Antes</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Después</TableHead>
            <TableHead className="hidden md:table-cell">Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.map((mov) => (
            <TableRow key={mov.id}>
              <TableCell className="tabular-nums text-slate-600">
                {format(mov.createdAt, "HH:mm", { locale: es })}
              </TableCell>
              <TableCell className="font-medium">{mov.itemNombre}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    mov.tipo === "ENTRADA"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-orange-200 bg-orange-50 text-orange-800",
                  )}
                >
                  {mov.tipo === "ENTRADA" ? (
                    <ArrowDownLeft className="h-3 w-3" aria-hidden />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  )}
                  {mov.tipo === "ENTRADA" ? "Entrada" : "Salida"}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCantidad(mov.cantidad, labelUnidad(mov.unidad))}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums text-slate-600 sm:table-cell">
                {formatCantidad(mov.stockAntes, labelUnidad(mov.unidad))}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {formatCantidad(mov.stockDespues, labelUnidad(mov.unidad))}
              </TableCell>
              <TableCell className="hidden text-slate-600 md:table-cell">{mov.userName ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReporteContenido({
  datos,
  tituloVista,
}: {
  datos: ReporteRanchoDatos;
  tituloVista?: string;
}) {
  const resumen = useMemo(() => resumirReporteLineas(datos.lineas), [datos.lineas]);

  return (
    <div className="space-y-4">
      <ResumenEstados resumen={resumen} />
      <div className="space-y-2">
        {tituloVista ? (
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tituloVista}</h3>
        ) : null}
        <ExistenciasTable lineas={datos.lineas} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Movimientos del día ({datos.movimientos.length})
        </h3>
        <MovimientosDelDia movimientos={datos.movimientos} />
      </div>
    </div>
  );
}

function ReporteForm({
  previewsByFecha,
  fechas,
  canWrite,
}: Pick<Props, "previewsByFecha" | "fechas" | "canWrite">) {
  const [state, action, pending] = useActionState(generarReporteRancho, inventarioInitialActionState);
  const [celebrateOpen, setCelebrateOpen] = useCelebrateOnOkTransition(state.ok);

  const fechasDisponibles = fechas.filter((f) => !f.yaReportado);
  const defaultFecha = fechasDisponibles[0]?.value ?? fechas[0]?.value ?? "";
  const [fecha, setFecha] = useState(defaultFecha);
  const sinFechas = fechasDisponibles.length === 0;

  const fechaVista = sinFechas ? (fechas[0]?.value ?? fecha) : fecha;
  const datos = previewsByFecha[fechaVista] ?? { fecha: fechaVista, lineas: [], movimientos: [] };

  return (
    <>
      <SuccessCelebrationDialog
        open={celebrateOpen}
        onOpenChange={setCelebrateOpen}
        variant="created"
        title="Reporte registrado"
        description="El reporte diario del rancho quedó guardado correctamente."
      />

      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex min-w-0 gap-2.5">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden />
            <div className="min-w-0 space-y-0.5">
              <CardTitle className="text-base font-semibold text-slate-900">Generar reporte</CardTitle>
              <CardDescription className="text-xs leading-snug text-slate-600">
                Muestra lo que había ayer, los movimientos del día y el stock al momento de reportar.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 py-4">
          {canWrite ? (
            sinFechas ? (
              <div
                role="status"
                className="rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950"
              >
                <p className="font-medium">Reportes al día</p>
                <p className="mt-0.5 text-xs text-emerald-900/80">
                  Ya se registraron los reportes de hoy y ayer. Vuelva mañana para el siguiente corte.
                </p>
              </div>
            ) : (
              <form action={action} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="reporte-fecha">Fecha del reporte</Label>
                    <Select
                      name="fecha"
                      value={fecha}
                      onValueChange={(value) => setFecha(value ?? defaultFecha)}
                      required
                    >
                      <SelectTrigger id="reporte-fecha" className="bg-white">
                        <SelectValue placeholder="Seleccione la fecha" />
                      </SelectTrigger>
                      <SelectContent>
                        {fechasDisponibles.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                            {f.isToday ? " (hoy)" : " (ayer)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {state.errors?.fecha ? (
                      <p className="text-xs text-red-600">{state.errors.fecha}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="reporte-notas">Observaciones (opcional)</Label>
                    <Textarea
                      id="reporte-notas"
                      name="notas"
                      rows={2}
                      placeholder="Novedades del día, reposiciones pendientes…"
                      className="resize-none bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={pending || datos.lineas.length === 0}>
                    <Save className="h-4 w-4" aria-hidden />
                    {pending ? "Guardando…" : "Registrar reporte"}
                  </Button>
                </div>
              </form>
            )
          ) : (
            <p className="text-sm text-slate-600">
              Solo puede consultar reportes. No tiene permiso para registrarlos.
            </p>
          )}

          {!sinFechas || datos.lineas.length > 0 ? (
            <ReporteContenido
              datos={datos}
              tituloVista={
                sinFechas
                  ? "Vista de hoy"
                  : `Vista previa — ${fechas.find((f) => f.value === fechaVista)?.label ?? fechaVista}`
              }
            />
          ) : (
            <p className="text-sm text-slate-600">No hay ítems activos en el inventario del rancho.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ReporteDetalle({
  detalle,
  canDeleteReportes,
}: {
  detalle: ReporteRanchoDetalle;
  canDeleteReportes: boolean;
}) {
  const autor = detalle.user.name ?? detalle.user.email ?? "Usuario";
  const pdfUrl = `/api/inventario/rancho/reportes/${encodeURIComponent(detalle.id)}/pdf`;
  const fechaLabel = format(detalle.fecha, "d 'de' MMMM yyyy", { locale: es });

  return (
    <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900">
              Reporte del {fechaLabel}
            </CardTitle>
            <CardDescription className="text-xs leading-snug text-slate-600">
              Registrado el {format(detalle.createdAt, "d MMM yyyy, HH:mm", { locale: es })} por {autor}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={pdfUrl} className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
              <FileDown className="h-4 w-4" aria-hidden />
              Descargar PDF
            </a>
            {canDeleteReportes ? (
              <DeleteReporteButton reporteId={detalle.id} fechaLabel={fechaLabel} />
            ) : null}
            <Link
              href={routes.inventario.ranchoReportes}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-4">
        {detalle.notas ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observaciones</p>
            <p className="mt-1 whitespace-pre-wrap">{detalle.notas}</p>
          </div>
        ) : null}
        <ReporteContenido
          datos={{ fecha: format(detalle.fecha, "yyyy-MM-dd"), lineas: detalle.lineas, movimientos: detalle.movimientos }}
        />
      </CardContent>
    </Card>
  );
}

function ReportesHistorial({ reportes }: { reportes: ReporteRanchoListRow[] }) {
  if (reportes.length === 0) {
    return (
      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardContent className="px-4 py-8 text-center text-sm text-slate-600">
          Aún no hay reportes registrados.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-700" aria-hidden />
          <CardTitle className="text-base font-semibold text-slate-900">Historial</CardTitle>
        </div>
      </CardHeader>
      <ul className="divide-y divide-slate-100">
        {reportes.map((reporte) => {
          const resumen = resumirReporteLineas(reporte.lineas);
          const autor = reporte.user.name ?? reporte.user.email ?? "Usuario";
          return (
            <li key={reporte.id}>
              <Link
                href={`${routes.inventario.ranchoReportes}?id=${encodeURIComponent(reporte.id)}`}
                className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {format(reporte.fecha, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {autor} · {format(reporte.createdAt, "d MMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {REPORTE_RANCHO_ESTADOS.map((estado) =>
                    resumen[estado] > 0 ? (
                      <span
                        key={estado}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
                          ESTADO_STYLES[estado].badge,
                        )}
                      >
                        {REPORTE_ESTADO_LABELS[estado]}: {resumen[estado]}
                      </span>
                    ) : null,
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function ReportesRanchoView({
  previewsByFecha,
  fechas,
  reportes,
  detalle,
  canWrite,
  canDeleteReportes,
}: Props) {
  if (detalle) {
    return <ReporteDetalle detalle={detalle} canDeleteReportes={canDeleteReportes} />;
  }

  return (
    <div className="space-y-5">
      <ReporteForm previewsByFecha={previewsByFecha} fechas={fechas} canWrite={canWrite} />
      <ReportesHistorial reportes={reportes} />
    </div>
  );
}
