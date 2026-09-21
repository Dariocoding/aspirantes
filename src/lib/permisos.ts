import { TipoPermisoPersonal } from "@src/generated/prisma";

export const PERMISO_TIPO_OPCIONES = [
  { value: TipoPermisoPersonal.SALIDA, label: "Salida" },
  { value: TipoPermisoPersonal.PERNOCTA, label: "Pernocta" },
  { value: TipoPermisoPersonal.FIN_DE_SEMANA, label: "Fin de semana" },
  { value: TipoPermisoPersonal.MEDICO, label: "Médico" },
  { value: TipoPermisoPersonal.COMISION, label: "Comisión" },
  { value: TipoPermisoPersonal.FAMILIAR, label: "Familiar" },
  { value: TipoPermisoPersonal.OTRO, label: "Otro" },
] as const;

export type PermisoTipoValue = (typeof PERMISO_TIPO_OPCIONES)[number]["value"];

export type EstadoPermiso = "PROGRAMADO" | "VIGENTE" | "FINALIZADO" | "ANULADO";

export const PERMISO_ESTADO_LABEL: Record<EstadoPermiso, string> = {
  PROGRAMADO: "Programado",
  VIGENTE: "Vigente",
  FINALIZADO: "Finalizado",
  ANULADO: "Anulado",
};

export function labelTipoPermiso(tipo: string): string {
  return PERMISO_TIPO_OPCIONES.find((o) => o.value === tipo)?.label ?? tipo;
}

export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

export function estadoPermiso(input: {
  fechaInicio: Date;
  fechaFin: Date;
  anulado: boolean;
  now?: Date;
}): EstadoPermiso {
  if (input.anulado) return "ANULADO";
  const now = input.now ?? new Date();
  const t = now.getTime();
  if (t < input.fechaInicio.getTime()) return "PROGRAMADO";
  if (t > input.fechaFin.getTime()) return "FINALIZADO";
  return "VIGENTE";
}

export function duracionPermisoHoras(fechaInicio: Date, fechaFin: Date): number {
  return Math.max(0, (fechaFin.getTime() - fechaInicio.getTime()) / 3_600_000);
}

export function formatDuracionPermiso(fechaInicio: Date, fechaFin: Date): string {
  const hours = duracionPermisoHoras(fechaInicio, fechaFin);
  if (hours < 24) {
    const h = Math.round(hours * 10) / 10;
    return h === 1 ? "1 hora" : `${h} horas`;
  }
  const days = Math.round((hours / 24) * 10) / 10;
  return days === 1 ? "1 día" : `${days} días`;
}

export function permisoEstadoBadgeClass(estado: EstadoPermiso): string {
  switch (estado) {
    case "VIGENTE":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "PROGRAMADO":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "FINALIZADO":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "ANULADO":
      return "border-rose-200 bg-rose-50 text-rose-900";
  }
}
