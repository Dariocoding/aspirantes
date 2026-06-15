import Link from "next/link";
import { auth } from "@src/auth";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Warehouse,
} from "lucide-react";
import { InventarioStats } from "@dashboard/inventario/_components/inventario-stats";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canReadInventario, canReadInventarioArea } from "@src/lib/inventario/access";
import { formatCantidad, INVENTARIO_AREAS, labelUnidad } from "@src/lib/inventario/area";
import {
  getInventarioRecentMovimientos,
  getInventarioStats,
  getInventarioStockAlerts,
} from "@src/lib/inventario/stats";
import { routes } from "@src/lib/apps/routes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@src/lib/utils";

import { redirect, unauthorized } from "next/navigation";

const moduleLinkClass =
  "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400";

export default async function InventarioDashboardPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  if (!canReadInventario(ctx)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const canRancho = canReadInventarioArea(ctx, "RANCHO");

  const ranchoData = canRancho
    ? await Promise.all([
        getInventarioStats("RANCHO"),
        getInventarioStockAlerts("RANCHO", 5),
        getInventarioRecentMovimientos("RANCHO", 6),
      ]).then(([stats, alerts, movimientos]) => ({ stats, alerts, movimientos }))
    : null;

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Control de inventario</h1>
        <p className="mt-1 text-sm text-slate-600">
          Existencias, entradas y salidas de insumos en el rancho.
        </p>
      </header>

      {canRancho ? (
        <nav aria-label="Áreas de inventario" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            <li>
              <Link href={INVENTARIO_AREAS.RANCHO.route} className={moduleLinkClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-900">
                  <Warehouse className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{INVENTARIO_AREAS.RANCHO.title}</p>
                  <p className="truncate text-xs text-slate-500">{INVENTARIO_AREAS.RANCHO.subtitle}</p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
            <li>
              <Link href={routes.inventario.ranchoReportes} className={moduleLinkClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-900">
                  <ClipboardList className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">Reportes del rancho</p>
                  <p className="truncate text-xs text-slate-500">
                    Corte diario: qué queda, qué falta y qué no hay.
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}

      {canRancho && ranchoData ? (
        <AreaSummary
          label="Rancho"
          route={INVENTARIO_AREAS.RANCHO.route}
          stats={ranchoData.stats}
          alerts={ranchoData.alerts}
          movimientos={ranchoData.movimientos}
        />
      ) : null}
    </div>
  );
}

function AreaSummary({
  label,
  route,
  stats,
  alerts,
  movimientos,
}: {
  label: string;
  route: string;
  stats: Awaited<ReturnType<typeof getInventarioStats>>;
  alerts: Awaited<ReturnType<typeof getInventarioStockAlerts>>;
  movimientos: Awaited<ReturnType<typeof getInventarioRecentMovimientos>>;
}) {
  const hasAlerts = alerts.length > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h2>
        <Link
          href={route}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-900 hover:text-amber-950 hover:underline"
        >
          Gestionar
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <InventarioStats stats={stats} />

      {hasAlerts ? (
        <div className="overflow-hidden rounded-lg border border-amber-200/80 bg-amber-50/60">
          <ul className="divide-y divide-amber-100/80 bg-white/70">
            {alerts.map((item) => {
              const sinStock = item.stockActual <= 0;
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <p className="truncate text-sm font-medium text-slate-900">{item.nombre}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
                      sinStock
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-900",
                    )}
                  >
                    {formatCantidad(item.stockActual, labelUnidad(item.unidad))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {movimientos.length > 0 ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {movimientos.slice(0, 4).map((mov) => (
            <li key={mov.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  mov.tipo === "ENTRADA"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-orange-200 bg-orange-50 text-orange-700",
                )}
                aria-hidden
              >
                {mov.tipo === "ENTRADA" ? (
                  <ArrowDownLeft className="h-3 w-3" />
                ) : (
                  <ArrowUpRight className="h-3 w-3" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{mov.item.nombre}</p>
                <p className="text-xs text-slate-500">
                  {format(mov.createdAt, "d MMM, HH:mm", { locale: es })}
                </p>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-slate-700">
                {mov.tipo === "ENTRADA" ? "+" : "−"}
                {formatCantidad(mov.cantidad, mov.item.unidad)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
