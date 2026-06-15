import type { InventarioStats as InventarioStatsData } from "@src/lib/inventario/stats";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@src/lib/utils";

type Props = {
  stats?: InventarioStatsData;
};

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "warning" | "danger" | "success";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums leading-none",
          highlight === "danger" && value !== 0 && value !== "0" && "text-red-700",
          highlight === "warning" && value !== 0 && value !== "0" && "text-amber-800",
          highlight === "success" && "text-emerald-800",
          !highlight && "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function InventarioStats({ stats }: Props) {
  if (!stats) return null;

  const ultimoMov =
    stats.ultimoMovimiento != null
      ? format(stats.ultimoMovimiento, "d MMM, HH:mm", { locale: es })
      : "—";

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
      <div className="bg-white px-4 py-3">
        <Stat label="Ítems registrados" value={stats.totalItems} />
      </div>
      <div className="bg-white px-4 py-3">
        <Stat label="Activos" value={stats.activos} highlight="success" />
      </div>
      <div className="bg-white px-4 py-3">
        <Stat label="Sin stock" value={stats.sinStock} highlight="danger" />
      </div>
      <div className="bg-white px-4 py-3">
        <Stat label="Stock bajo" value={stats.stockBajo} highlight="warning" />
      </div>
      <div className="bg-white px-4 py-3 sm:col-span-2 lg:col-span-1">
        <Stat label="Movimientos hoy" value={stats.movimientosHoy} />
        <p className="mt-1 text-[10px] text-slate-400">Último: {ultimoMov}</p>
      </div>
    </div>
  );
}
