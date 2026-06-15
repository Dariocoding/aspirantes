import { AuditMetadataToggle } from "@dashboard/sistema/auditoria/_components/audit-metadata-toggle";
import {
  auditActionAccentClass,
  auditActionLabel,
  auditBadgeClass,
  auditEntityLabel,
  auditUserInitials,
} from "@dashboard/sistema/auditoria/_components/audit-utils";
import { AUDIT_PAGE_SIZE } from "@dashboard/sistema/auditoria/_components/constants";
import { buttonVariants } from "@src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/components/ui/card";
import { routes } from "@src/lib/apps/routes";
import type { SistemaAuditStats } from "@src/lib/sistema/stats";
import { cn } from "@src/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import Link from "next/link";

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  userEmail: string | null;
  user: { name: string | null; email: string | null } | null;
};

type Props = {
  logs: AuditLogRow[];
  stats: SistemaAuditStats;
  page: number;
  totalPages: number;
  total: number;
};

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <Icon className="h-4 w-4 text-white/90" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
          {label}
        </p>
        <p className="truncate text-lg font-semibold tabular-nums leading-none text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function paginationHref(page: number) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${routes.sistema.auditoria}?${qs}` : routes.sistema.auditoria;
}

function formatEventDate(date: Date) {
  return format(date, "d MMM yyyy", { locale: es });
}

function formatEventTime(date: Date) {
  return format(date, "HH:mm:ss", { locale: es });
}

export function AuditoriaView({ logs, stats, page, totalPages, total }: Props) {
  const rangeStart = total === 0 ? 0 : (page - 1) * AUDIT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * AUDIT_PAGE_SIZE, total);
  const lastEventLabel = stats.lastEventAt
    ? format(stats.lastEventAt, "d MMM, HH:mm", { locale: es })
    : "—";

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5">
      <Card className="gap-0 overflow-hidden py-0 shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white px-4 py-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <CardTitle className="text-base font-semibold text-slate-900">
                Registro de eventos
              </CardTitle>
              <CardDescription className="text-xs leading-snug text-slate-600">
                {total === 0
                  ? "No hay eventos registrados todavía."
                  : `Mostrando ${rangeStart}–${rangeEnd} de ${total} eventos · 10 por página`}
              </CardDescription>
            </div>
            {stats.topActions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {stats.topActions.slice(0, 3).map((item) => (
                  <span
                    key={item.action}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600"
                  >
                    <span className="font-medium text-slate-800">
                      {auditActionLabel(item.action)}
                    </span>
                    <span className="tabular-nums text-slate-400">
                      ×{item.count}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ScrollText className="h-7 w-7" aria-hidden />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-800">
                Sin registros de auditoría
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Cuando se realicen operaciones sensibles en el sistema,
                aparecerán aquí con su trazabilidad completa.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map((log) => {
                const displayName =
                  log.user?.name ?? log.userEmail ?? "Usuario desconocido";
                const displayEmail = log.user?.email ?? log.userEmail;
                const accent = auditActionAccentClass(log.action);

                return (
                  <li
                    key={log.id}
                    className="group relative bg-white transition-colors hover:bg-slate-50/70"
                  >
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 w-1 rounded-r-full opacity-80",
                        accent,
                      )}
                      aria-hidden
                    />
                    <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] sm:items-start sm:gap-4 sm:pl-5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tabular-nums text-slate-900">
                          {formatEventDate(log.createdAt)}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-500">
                          {formatEventTime(log.createdAt)} UTC
                        </p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={auditBadgeClass(log.action)}>
                            {auditActionLabel(log.action)}
                          </span>
                          <span className="text-[11px] text-slate-400">·</span>
                          <span className="text-xs font-medium text-slate-700">
                            {auditEntityLabel(log.entityType)}
                          </span>
                          {log.entityId ? (
                            <span className="max-w-[12rem] truncate font-mono text-[10px] text-slate-400 sm:max-w-xs">
                              {log.entityId}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2.5 flex items-start gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
                            {auditUserInitials(log.user?.name, displayEmail)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {displayName}
                            </p>
                            {displayEmail ? (
                              <p className="truncate text-xs text-slate-500">
                                {displayEmail}
                              </p>
                            ) : null}
                            {log.userAgent ? (
                              <p
                                className="mt-1 line-clamp-1 text-[10px] text-slate-400"
                                title={log.userAgent}
                              >
                                {log.userAgent}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {log.metadata != null ? (
                          <AuditMetadataToggle metadata={log.metadata} />
                        ) : null}
                      </div>

                      <div className="sm:text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          IP
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-700">
                          {log.ip ?? "—"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {total > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-200/90 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Página{" "}
                <span className="font-semibold tabular-nums text-slate-800">
                  {page}
                </span>{" "}
                de{" "}
                <span className="font-semibold tabular-nums text-slate-800">
                  {totalPages}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={paginationHref(page - 1)}
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
                    href={paginationHref(page + 1)}
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
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
