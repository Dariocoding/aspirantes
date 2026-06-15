import type {
  SistemaAuditStats,
  SistemaUserStats,
} from "@src/lib/sistema/stats";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Props = {
  userStats?: SistemaUserStats;
  auditStats?: SistemaAuditStats;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none text-slate-900">
        {value}
      </p>
    </div>
  );
}

function formatLastEvent(date: Date | null): string {
  if (!date) return "—";
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function SistemaStats({ userStats, auditStats }: Props) {
  if (!userStats && !auditStats) return null;

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2">
      {userStats ? (
        <div className="grid grid-cols-3 gap-4 bg-white px-4 py-3">
          <Stat label="Usuarios" value={userStats.total} />
          <Stat label="Activos" value={userStats.active} />
          <Stat label="Inactivos" value={userStats.inactive} />
        </div>
      ) : null}
      {auditStats ? (
        <div className="grid grid-cols-2 gap-4 bg-white px-4 py-3">
          <Stat label="Eventos hoy" value={auditStats.today} />
          <Stat label="Últimos 7 días" value={auditStats.last7Days} />
        </div>
      ) : null}
    </div>
  );
}
