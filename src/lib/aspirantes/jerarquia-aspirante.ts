export const JERARQUIA_ASPIRANTE_VALUES = ["ASPIRANTE_OFICIAL", "DISTINGUIDO"] as const;

export type JerarquiaAspiranteValue = (typeof JERARQUIA_ASPIRANTE_VALUES)[number];

export const JERARQUIA_ASPIRANTE_LABELS: Record<JerarquiaAspiranteValue, string> = {
  ASPIRANTE_OFICIAL: "Aspirante a oficial",
  DISTINGUIDO: "Distinguido",
};

export const JERARQUIA_ASPIRANTE_ABREV: Record<JerarquiaAspiranteValue, string> = {
  ASPIRANTE_OFICIAL: "ASP/OFIC",
  DISTINGUIDO: "DIST",
};

export const JERARQUIA_ASPIRANTE_DEFAULT: JerarquiaAspiranteValue = "ASPIRANTE_OFICIAL";

export function isJerarquiaAspiranteValue(v: string | null | undefined): v is JerarquiaAspiranteValue {
  return v === "ASPIRANTE_OFICIAL" || v === "DISTINGUIDO";
}

export function labelJerarquiaAspirante(v: string | null | undefined): string {
  if (!isJerarquiaAspiranteValue(v)) return JERARQUIA_ASPIRANTE_LABELS.ASPIRANTE_OFICIAL;
  return JERARQUIA_ASPIRANTE_LABELS[v];
}

export function abrevJerarquiaAspirante(v: string | null | undefined): string {
  if (!isJerarquiaAspiranteValue(v)) return JERARQUIA_ASPIRANTE_ABREV.ASPIRANTE_OFICIAL;
  return JERARQUIA_ASPIRANTE_ABREV[v];
}

export function jerarquiaAspiranteRank(v: string | null | undefined): number {
  if (v === "DISTINGUIDO") return 0;
  return 1;
}

export function jerarquiaAspiranteGroupLabel(v: string | null | undefined): string {
  return labelJerarquiaAspirante(v);
}

/**
 * Interpreta el valor de un formulario o de un Excel.
 * `null` / vacío → default ASPIRANTE_OFICIAL.
 * `undefined` → texto que no corresponde.
 */
export function parseJerarquiaAspirante(
  raw: string | null | undefined,
): JerarquiaAspiranteValue | undefined {
  if (raw == null) return JERARQUIA_ASPIRANTE_DEFAULT;
  const t = raw.trim();
  if (!t || t === "—" || t === "-" || t === "–") return JERARQUIA_ASPIRANTE_DEFAULT;
  const upper = t
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9/]+/g, "_")
    .replace(/^_|_$/g, "");
  if (isJerarquiaAspiranteValue(upper)) return upper;
  if (upper.includes("DISTING")) return "DISTINGUIDO";
  if (upper.includes("ASP") || upper.includes("OFIC") || upper.includes("ASPIRANTE")) {
    return "ASPIRANTE_OFICIAL";
  }
  return undefined;
}
