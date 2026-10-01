export const CONDICION_MILITAR_VALUES = ["SOLDADO_ACTIVO", "SARGENTO_ACTIVO"] as const;

export type CondicionMilitarValue = (typeof CONDICION_MILITAR_VALUES)[number];

export const CONDICION_MILITAR_LABELS: Record<CondicionMilitarValue, string> = {
  SOLDADO_ACTIVO: "Soldado activo",
  SARGENTO_ACTIVO: "Sargento activo",
};

export function isCondicionMilitarValue(v: string | null | undefined): v is CondicionMilitarValue {
  return v === "SOLDADO_ACTIVO" || v === "SARGENTO_ACTIVO";
}

/** Filtro del censo: soldado activo o sargento activo. */
export const CONDICION_CENSUS_FILTERS = ["SOLDADO_ACTIVO", "SARGENTO_ACTIVO"] as const;

export type CondicionCensusFilter = (typeof CONDICION_CENSUS_FILTERS)[number];

export type CondicionCensusCounts = {
  soldado: number;
  sargento: number;
  sin: number;
};

export function parseCondicionCensusFilter(
  raw: string | null | undefined,
): CondicionCensusFilter | null {
  if (isCondicionMilitarValue(raw)) return raw;
  return null;
}

export function labelCondicionCensusFilter(v: CondicionCensusFilter): string {
  return CONDICION_MILITAR_LABELS[v];
}

export function condicionCensusTotal(counts: CondicionCensusCounts) {
  return counts.soldado + counts.sargento + counts.sin;
}

/** Orden fijo del censo: soldado activo, sargento activo, sin clasificar. */
export function condicionMilitarRank(v: string | null | undefined): number {
  if (v === "SOLDADO_ACTIVO") return 0;
  if (v === "SARGENTO_ACTIVO") return 1;
  return 2;
}

export function labelCondicionMilitar(v: string | null | undefined): string | null {
  if (!isCondicionMilitarValue(v)) return null;
  return CONDICION_MILITAR_LABELS[v];
}

/** Etiqueta de grupo en el censo. Vacío = aún sin clasificar. */
export function condicionMilitarGroupLabel(v: string | null | undefined): string {
  return labelCondicionMilitar(v) ?? "Sin clasificar";
}

/**
 * Interpreta el valor de un formulario o de un Excel.
 * `null` = vacío. `undefined` = texto que no corresponde a ninguna condición.
 */
export function parseCondicionMilitar(
  raw: string | null | undefined,
): CondicionMilitarValue | null | undefined {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || t === "—" || t === "-" || t === "–") return null;
  const upper = t
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, "_")
    .replace(/^_|_$/g, "");
  if (isCondicionMilitarValue(upper)) return upper;
  if (upper.startsWith("SOLDADO")) return "SOLDADO_ACTIVO";
  if (upper.startsWith("SARGENTO")) return "SARGENTO_ACTIVO";
  return undefined;
}
