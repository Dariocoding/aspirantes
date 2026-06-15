import { cn } from "@src/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  ASPIRANTE_CREATE: "Alta de aspirante",
  ASPIRANTE_UPDATE: "Actualización de aspirante",
  ASPIRANTE_DELETE: "Eliminación de aspirante",
  CONVOCATORIA_CREATE: "Nueva convocatoria",
  CONVOCATORIA_CREATE_ACTIVA: "Convocatoria creada (activa)",
  CONVOCATORIA_UPDATE: "Actualización de convocatoria",
  CONVOCATORIA_DELETE: "Eliminación de convocatoria",
  CONVOCATORIA_ACTIVAR: "Activación de convocatoria",
  CENSO_EXPORT_PDF: "Exportación PDF del censo",
  CENSO_EXPORT_XLSX: "Exportación Excel del censo",
};

const ENTITY_LABELS: Record<string, string> = {
  ASPIRANTE: "Aspirante",
  CONVOCATORIA: "Convocatoria",
  CENSO: "Censo",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

export function auditEntityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

export function auditActionBadgeClass(action: string): string {
  if (action.includes("DELETE")) {
    return "border-rose-200/90 bg-rose-50 text-rose-900";
  }
  if (action.includes("CREATE") || action.includes("ACTIVAR")) {
    return "border-emerald-200/90 bg-emerald-50 text-emerald-900";
  }
  if (action.includes("UPDATE")) {
    return "border-sky-200/90 bg-sky-50 text-sky-900";
  }
  if (action.includes("EXPORT")) {
    return "border-amber-200/90 bg-amber-50 text-amber-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function auditActionAccentClass(action: string): string {
  if (action.includes("DELETE")) return "bg-rose-500";
  if (action.includes("CREATE") || action.includes("ACTIVAR")) return "bg-emerald-500";
  if (action.includes("UPDATE")) return "bg-sky-500";
  if (action.includes("EXPORT")) return "bg-amber-500";
  return "bg-slate-400";
}

export function auditUserInitials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function auditBadgeClass(action: string, className?: string) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none",
    auditActionBadgeClass(action),
    className,
  );
}
