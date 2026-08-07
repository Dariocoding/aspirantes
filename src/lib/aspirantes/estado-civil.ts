export const ESTADO_CIVIL_VALUES = [
  "SOLTERO",
  "CASADO",
  "DIVORCIADO",
  "VIUDO",
  "UNION_ESTABLE",
] as const;

export type EstadoCivilValue = (typeof ESTADO_CIVIL_VALUES)[number];

export const ESTADO_CIVIL_LABELS: Record<EstadoCivilValue, string> = {
  SOLTERO: "Soltero(a)",
  CASADO: "Casado(a)",
  DIVORCIADO: "Divorciado(a)",
  VIUDO: "Viudo(a)",
  UNION_ESTABLE: "Unión estable",
};

/** Etiqueta en mayúsculas para la ficha técnica PDF. */
export const ESTADO_CIVIL_PDF_LABELS: Record<EstadoCivilValue, string> = {
  SOLTERO: "SOLTERO(A)",
  CASADO: "CASADO(A)",
  DIVORCIADO: "DIVORCIADO(A)",
  VIUDO: "VIUDO(A)",
  UNION_ESTABLE: "UNIÓN ESTABLE",
};

export function isEstadoCivilValue(v: string | null | undefined): v is EstadoCivilValue {
  return (
    v === "SOLTERO" ||
    v === "CASADO" ||
    v === "DIVORCIADO" ||
    v === "VIUDO" ||
    v === "UNION_ESTABLE"
  );
}

export function labelEstadoCivil(v: string | null | undefined): string | null {
  if (!isEstadoCivilValue(v)) return null;
  return ESTADO_CIVIL_LABELS[v];
}

export function labelEstadoCivilPdf(v: string | null | undefined): string | null {
  if (!isEstadoCivilValue(v)) return null;
  return ESTADO_CIVIL_PDF_LABELS[v];
}
