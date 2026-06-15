"use client";

import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  ClipboardList,
  Package,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteInventarioItem } from "@src/app/actions/inventario";
import {
  InventarioEditTriggerButton,
  InventarioItemCreateDialog,
  InventarioItemEditDialog,
  InventarioMovimientoDialog,
  type InventarioItemRow,
  type InventarioMovimientoRow,
} from "@dashboard/inventario/_components/inventario-modals";
import { InventarioItemThumbnail } from "@dashboard/inventario/_components/inventario-item-imagen";
import { InventarioStats } from "@dashboard/inventario/_components/inventario-stats";
import { Button, buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { Input } from "@src/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/components/ui/table";
import type { AreaInventario } from "@src/generated/prisma";
import { formatCantidad, INVENTARIO_AREAS, labelUnidad } from "@src/lib/inventario/area";
import {
  inventarioListHref,
  type InventarioItemsQuery,
  type InventarioItemsSort,
  type InventarioItemsSortDir,
} from "@src/lib/inventario/queries";
import type { InventarioStats as InventarioStatsData } from "@src/lib/inventario/stats";
import { cn } from "@src/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Props = {
  area: AreaInventario;
  items: InventarioItemRow[];
  movimientos: InventarioMovimientoRow[];
  canWrite: boolean;
  stats?: InventarioStatsData;
  listQuery: Required<InventarioItemsQuery>;
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
  totalInArea: number;
  alertCount: number;
};

function stockBadgeClass(item: InventarioItemRow) {
  if (!item.activo) return "border-slate-200 bg-slate-50 text-slate-600";
  if (item.stockMinimo != null && item.stockActual <= item.stockMinimo) {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (item.stockActual <= 0) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

/** Nivel de alerta de stock para resaltar la fila. */
function stockAlertLevel(item: InventarioItemRow): "sin_stock" | "bajo_minimo" | null {
  if (!item.activo) return null;
  if (item.stockActual <= 0) return "sin_stock";
  if (item.stockMinimo != null && item.stockActual <= item.stockMinimo) return "bajo_minimo";
  return null;
}

/** Cantidad que falta para alcanzar el stock mínimo; null si ya cumple o no hay mínimo. */
function faltaPorStock(item: InventarioItemRow): number | null {
  if (item.stockMinimo == null) return null;
  const falta = item.stockMinimo - item.stockActual;
  return falta > 0 ? falta : null;
}

function sortHref(
  route: string,
  listQuery: Required<InventarioItemsQuery>,
  sortKey: InventarioItemsSort,
): string {
  const active = listQuery.sort === sortKey;
  const dir: InventarioItemsSortDir = active && listQuery.dir === "asc" ? "desc" : "asc";
  return inventarioListHref(route, {
    sort: sortKey,
    dir,
    q: listQuery.q || undefined,
    page: 1,
  });
}

function SortableTableHead({
  label,
  sortKey,
  listQuery,
  route,
  className,
}: {
  label: string;
  sortKey: InventarioItemsSort;
  listQuery: Required<InventarioItemsQuery>;
  route: string;
  className?: string;
}) {
  const active = listQuery.sort === sortKey;
  const href = sortHref(route, listQuery, sortKey);
  return (
    <TableHead
      className={cn(
        "h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600",
        className,
      )}
    >
      <Link
        href={href}
        prefetch={false}
        title="Clic para ordenar"
        className={cn(
          "-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-200/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
          active && "bg-slate-200/50 text-slate-900",
        )}
        aria-sort={active ? (listQuery.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        {active ? (
          listQuery.dir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        )}
      </Link>
    </TableHead>
  );
}

export function InventarioAreaView({
  area,
  items,
  movimientos,
  canWrite,
  stats,
  listQuery,
  pagination,
  totalInArea,
  alertCount,
}: Props) {
  const config = INVENTARIO_AREAS[area];
  const route = config.route;
  const { page, totalPages, totalItems, pageSize } = pagination;
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  const [editTarget, setEditTarget] = useState<InventarioItemRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = (item: InventarioItemRow) => {
    setEditTarget(item);
    setEditOpen(true);
  };

  const onEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (!open) setEditTarget(null);
  };

  const colSpan = canWrite ? 6 : 5;

  return (
    <div className="space-y-5">
      <InventarioItemEditDialog item={editTarget} area={area} open={editOpen} onOpenChange={onEditOpenChange} />

      <Card className="gap-0 py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-2.5">
              <Package className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden />
              <div className="min-w-0 space-y-0.5">
                <CardTitle className="text-base font-semibold text-slate-900">{config.title}</CardTitle>
                <CardDescription className="text-xs leading-snug text-slate-600">
                  {config.subtitle}
                  <span className="text-slate-400"> · </span>
                  <span className="font-medium tabular-nums text-slate-800">{totalInArea}</span>
                  {totalInArea === 1 ? " ítem" : " ítems"}
                </CardDescription>
              </div>
            </div>
            <InventarioItemCreateDialog area={area} canWrite={canWrite} />
          </div>
        </CardHeader>
      </Card>

      {stats ? <InventarioStats stats={stats} /> : null}

      {alertCount > 0 ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" aria-hidden />
          <div>
            <p className="font-medium">
              {alertCount === 1
                ? "1 ítem requiere atención"
                : `${alertCount} ítems requieren atención`}
            </p>
            <p className="mt-0.5 text-xs text-amber-900/80">
              Sin stock o por debajo del mínimo configurado. Registre una entrada para reponer.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Existencias</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Stock actual por ítem. Clic en «Ítem» o «Stock» para ordenar · {pageSize} por página.
              </CardDescription>
            </div>
            {totalInArea > 0 ? (
              <form action={route} method="get" className="relative w-full sm:max-w-xs">
                {listQuery.sort !== "nombre" || listQuery.dir !== "asc" ? (
                  <>
                    <input type="hidden" name="sort" value={listQuery.sort} />
                    <input type="hidden" name="dir" value={listQuery.dir} />
                  </>
                ) : null}
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  type="search"
                  name="q"
                  placeholder="Buscar ítem…"
                  defaultValue={listQuery.q}
                  className="h-8 pl-8 text-sm shadow-xs"
                  aria-label="Buscar ítem en inventario"
                />
              </form>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {totalInArea > 0 ? (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-600">
              <span className="font-medium text-slate-700">Leyenda:</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-full bg-red-500" aria-hidden />
                Sin stock
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-full bg-amber-500" aria-hidden />
                Por debajo del mínimo
              </span>
            </div>
          ) : null}
          <div className="-mx-4 overflow-x-auto border-y border-slate-200/90 bg-white sm:mx-0 sm:border-x sm:border-t-0">
            <Table>
              <TableHeader className="[&_tr]:border-slate-200 [&_tr]:hover:bg-transparent">
                <TableRow className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90">
                  <SortableTableHead label="Ítem" sortKey="nombre" listQuery={listQuery} route={route} />
                  <SortableTableHead label="Stock" sortKey="stock" listQuery={listQuery} route={route} />
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Falta
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Unidad
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Estado
                  </TableHead>
                  {canWrite ? (
                    <TableHead className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Acciones
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalInArea === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={colSpan} className="h-32 whitespace-normal px-4 text-center text-sm text-slate-500">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Package className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="font-medium text-slate-700">No hay ítems registrados</p>
                        <p className="text-xs text-slate-500">
                          {canWrite
                            ? "Use «Nuevo ítem» para registrar el primer producto o insumo."
                            : "No hay datos para mostrar."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : totalItems === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={colSpan} className="h-24 px-4 text-center text-sm text-slate-500">
                      Ningún ítem coincide con «{listQuery.q}».
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const falta = faltaPorStock(item);
                    const alert = stockAlertLevel(item);
                    return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "border-slate-100 transition-colors",
                        alert === "sin_stock" &&
                          "border-l-4 border-l-red-500 bg-red-50/50 hover:bg-red-50/70",
                        alert === "bajo_minimo" &&
                          "border-l-4 border-l-amber-500 bg-amber-50/60 hover:bg-amber-50/80",
                      )}
                    >
                      <TableCell className="max-w-[260px] px-4 py-3">
                        <div className="flex items-start gap-3">
                          <InventarioItemThumbnail
                            itemId={item.id}
                            imagenKey={item.imagenKey}
                            nombre={item.nombre}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-start gap-1.5">
                              {alert ? (
                                <AlertTriangle
                                  className={cn(
                                    "mt-0.5 h-4 w-4 shrink-0",
                                    alert === "sin_stock" ? "text-red-600" : "text-amber-600",
                                  )}
                                  aria-hidden
                                />
                              ) : null}
                              <p className="font-medium text-slate-900">{item.nombre}</p>
                            </div>
                            {item.descripcion ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.descripcion}</p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
                            stockBadgeClass(item),
                          )}
                        >
                          {formatCantidad(item.stockActual)}
                        </span>
                        {item.stockMinimo != null ? (
                          <p className="mt-1 text-[10px] text-slate-400">Mín: {formatCantidad(item.stockMinimo)}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {falta != null ? (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
                              item.stockActual <= 0
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-amber-200 bg-amber-50 text-amber-900",
                            )}
                            title={`Faltan ${formatCantidad(falta)} para el mínimo (${formatCantidad(item.stockMinimo!)})`}
                          >
                            {formatCantidad(falta)}
                          </span>
                        ) : item.stockMinimo == null ? (
                          <span className="text-xs text-slate-400" title="Sin stock mínimo configurado">
                            —
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700" title="Cumple el stock mínimo">
                            0
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">{labelUnidad(item.unidad)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          {item.activo ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              Inactivo
                            </span>
                          )}
                          {alert === "sin_stock" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                              Sin stock
                            </span>
                          ) : alert === "bajo_minimo" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                              Bajo mínimo
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      {canWrite ? (
                        <TableCell className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-2">
                            <InventarioMovimientoDialog item={item} area={area} tipo="ENTRADA" canWrite={canWrite} />
                            <InventarioMovimientoDialog item={item} area={area} tipo="SALIDA" canWrite={canWrite} />
                            <InventarioEditTriggerButton item={item} onEdit={openEdit} />
                            <form action={deleteInventarioItem} className="inline-flex">
                              <input type="hidden" name="id" value={item.id} />
                              <Button type="submit" variant="destructive" size="sm" className="gap-1.5 shadow-sm">
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Eliminar
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalItems > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-200/90 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Mostrando{" "}
                <span className="font-semibold tabular-nums text-slate-800">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                de{" "}
                <span className="font-semibold tabular-nums text-slate-800">{totalItems}</span>
                {totalPages > 1 ? (
                  <>
                    {" "}
                    · Página{" "}
                    <span className="font-semibold tabular-nums text-slate-800">{page}</span> de{" "}
                    <span className="font-semibold tabular-nums text-slate-800">{totalPages}</span>
                  </>
                ) : null}
              </p>
              {totalPages > 1 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={inventarioListHref(route, { ...listQuery, page: page - 1 })}
                      prefetch={false}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-9 gap-1 border-slate-200 bg-white pr-3 pl-2.5 shadow-sm",
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Anterior
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "pointer-events-none h-9 gap-1 border-slate-100 bg-slate-100/50 pr-3 pl-2.5 text-slate-400 opacity-60",
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Anterior
                    </span>
                  )}
                  {page < totalPages ? (
                    <Link
                      href={inventarioListHref(route, { ...listQuery, page: page + 1 })}
                      prefetch={false}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-9 gap-1 border-slate-200 bg-white pl-3 pr-2.5 shadow-sm",
                      )}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "pointer-events-none h-9 gap-1 border-slate-100 bg-slate-100/50 pl-3 pr-2.5 text-slate-400 opacity-60",
                      )}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <ClipboardList className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold text-slate-900">Movimientos recientes</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Últimas entradas y salidas registradas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="-mx-4 overflow-x-auto border-y border-slate-200/90 bg-white sm:mx-0 sm:border-x sm:border-t-0">
            <Table>
              <TableHeader className="[&_tr]:border-slate-200 [&_tr]:hover:bg-transparent">
                <TableRow className="border-slate-200 bg-slate-100/90 hover:bg-slate-100/90">
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Fecha
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Ítem
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Tipo
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Cantidad
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Stock
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Registrado por
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="h-24 px-4 text-center text-sm text-slate-500">
                      Aún no hay movimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((mov) => (
                    <TableRow key={mov.id} className="border-slate-100">
                      <TableCell className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                        {format(mov.createdAt, "d MMM yyyy, HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium text-slate-900">{mov.item.nombre}</TableCell>
                      <TableCell className="px-4 py-3">
                        {mov.tipo === "ENTRADA" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            <ArrowDownLeft className="h-3 w-3" aria-hidden />
                            Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                            <ArrowUpRight className="h-3 w-3" aria-hidden />
                            Salida
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 tabular-nums text-slate-700">
                        {formatCantidad(mov.cantidad, mov.item.unidad)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs tabular-nums text-slate-600">
                        {formatCantidad(mov.stockAntes)} → {formatCantidad(mov.stockDespues)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-600">
                        {mov.user?.name ?? mov.user?.email ?? "—"}
                        {mov.motivo ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{mov.motivo}</p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
