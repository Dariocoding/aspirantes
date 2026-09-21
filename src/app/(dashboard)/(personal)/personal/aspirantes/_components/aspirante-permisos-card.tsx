import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { routes } from "@src/lib/apps/routes";
import { formatDateTime } from "@src/lib/date";
import {
  estadoPermiso,
  formatDuracionPermiso,
  labelTipoPermiso,
  PERMISO_ESTADO_LABEL,
  permisoEstadoBadgeClass,
  type PermisoTipoValue,
} from "@src/lib/permisos";
import { cn } from "@src/lib/utils";

export type AspirantePermisoItem = {
  id: string;
  tipo: PermisoTipoValue;
  fechaInicioIso: string;
  fechaFinIso: string;
  motivo: string;
  destino: string | null;
  anulado: boolean;
};

export function AspirantePermisosCard({
  aspiranteId,
  permisos,
  canWrite,
}: {
  aspiranteId: string;
  permisos: AspirantePermisoItem[];
  canWrite: boolean;
}) {
  return (
    <Card className="shadow-sm ring-slate-200/80">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex gap-2">
            <CalendarClock className="mt-0.5 h-4 w-4 text-slate-700" aria-hidden />
            <div>
              <CardTitle className="text-base">Permisos</CardTitle>
              <CardDescription className="text-xs">
                Control de ausencias autorizadas de esta persona.
              </CardDescription>
            </div>
          </div>
          {canWrite ? (
            <Link
              href={`${routes.personal.permisos}?aspiranteId=${encodeURIComponent(aspiranteId)}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
            >
              Dar permiso
            </Link>
          ) : (
            <Link
              href={routes.personal.permisos}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
            >
              Ver control
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {permisos.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Sin permisos registrados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {permisos.map((p) => {
              const inicio = new Date(p.fechaInicioIso);
              const fin = new Date(p.fechaFinIso);
              const estado = estadoPermiso({
                fechaInicio: inicio,
                fechaFin: fin,
                anulado: p.anulado,
              });
              return (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {labelTipoPermiso(p.tipo)}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {formatDuracionPermiso(inicio, fin)}
                      </span>
                    </p>
                    <span
                      className={cn(
                        "inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                        permisoEstadoBadgeClass(estado),
                      )}
                    >
                      {PERMISO_ESTADO_LABEL[estado]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-slate-600">
                    {formatDateTime(inicio)} → {formatDateTime(fin)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.motivo}</p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
