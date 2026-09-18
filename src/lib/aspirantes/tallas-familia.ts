export const TALLA_UNIFORME_PATRIOTA_VALUES = [
  "XSS",
  "SS",
  "SR",
  "SL",
  "MS",
  "MR",
  "ML",
  "LR",
  "XL",
  "XLR",
  "XXL",
] as const;

export const TALLA_UNIFORME_OLIVA_FEM_VALUES = [
  "FEM_8_10",
  "FEM_10_12",
  "FEM_12_14",
  "FEM_14_16",
  "FEM_16_18",
  "FEM_18_20",
] as const;

export const TALLA_UNIFORME_OLIVA_MAS_VALUES = [
  "MAS_28_30",
  "MAS_30_32",
  "MAS_32_34",
  "MAS_34_36",
  "MAS_36_38",
  "MAS_38_40",
] as const;

export const TALLA_UNIFORME_OLIVA_VALUES = [
  "FEM_8_10",
  "FEM_10_12",
  "FEM_12_14",
  "FEM_14_16",
  "FEM_16_18",
  "FEM_18_20",
  "MAS_28_30",
  "MAS_30_32",
  "MAS_32_34",
  "MAS_34_36",
  "MAS_36_38",
  "MAS_38_40",
] as const;

export const TALLA_CAMISA_ALMILLA_VALUES = ["SS", "S", "M", "L", "XL", "XXL"] as const;

export const TALLA_GORRA_QUEPIS_VALUES = ["54", "55", "56", "57"] as const;

export type TallaUniformePatriotaValue = (typeof TALLA_UNIFORME_PATRIOTA_VALUES)[number];
export type TallaUniformeOlivaValue = (typeof TALLA_UNIFORME_OLIVA_VALUES)[number];
export type TallaCamisaAlmillaValue = (typeof TALLA_CAMISA_ALMILLA_VALUES)[number];
export type TallaGorraQuepisValue = (typeof TALLA_GORRA_QUEPIS_VALUES)[number];

export const TALLA_UNIFORME_PATRIOTA_LABELS: Record<TallaUniformePatriotaValue, string> = {
  XSS: "XSS",
  SS: "SS",
  SR: "SR",
  SL: "SL",
  MS: "MS",
  MR: "MR",
  ML: "ML",
  LR: "LR",
  XL: "XL",
  XLR: "XLR",
  XXL: "XXL",
};

export const TALLA_UNIFORME_OLIVA_LABELS: Record<TallaUniformeOlivaValue, string> = {
  FEM_8_10: "8/10",
  FEM_10_12: "10/12",
  FEM_12_14: "12/14",
  FEM_14_16: "14/16",
  FEM_16_18: "16/18",
  FEM_18_20: "18/20",
  MAS_28_30: "28/30",
  MAS_30_32: "30/32",
  MAS_32_34: "32/34",
  MAS_34_36: "34/36",
  MAS_36_38: "36/38",
  MAS_38_40: "38/40",
};

export const TALLA_CAMISA_ALMILLA_LABELS: Record<TallaCamisaAlmillaValue, string> = {
  SS: "SS",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
};

export const TALLA_GORRA_QUEPIS_LABELS: Record<TallaGorraQuepisValue, string> = {
  "54": "54",
  "55": "55",
  "56": "56",
  "57": "57",
};

export function isTallaUniformePatriota(v: string | null | undefined): v is TallaUniformePatriotaValue {
  return Boolean(v && (TALLA_UNIFORME_PATRIOTA_VALUES as readonly string[]).includes(v));
}

export function isTallaUniformeOliva(v: string | null | undefined): v is TallaUniformeOlivaValue {
  return Boolean(v && (TALLA_UNIFORME_OLIVA_VALUES as readonly string[]).includes(v));
}

export function isTallaCamisaAlmilla(v: string | null | undefined): v is TallaCamisaAlmillaValue {
  return Boolean(v && (TALLA_CAMISA_ALMILLA_VALUES as readonly string[]).includes(v));
}

export function isTallaGorraQuepis(v: string | null | undefined): v is TallaGorraQuepisValue {
  return Boolean(v && (TALLA_GORRA_QUEPIS_VALUES as readonly string[]).includes(v));
}

export function labelTallaUniformeOliva(v: string | null | undefined): string | null {
  if (!isTallaUniformeOliva(v)) return v?.trim() || null;
  const prefix = v.startsWith("FEM_") ? "Fem. " : "Mas. ";
  return `${prefix}${TALLA_UNIFORME_OLIVA_LABELS[v]}`;
}

export function labelPadresVenezolanos(v: boolean | null | undefined): string | null {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return null;
}

export const labelSiNo = labelPadresVenezolanos;

export function parsePadresVenezolanos(v: unknown): boolean | null {
  if (v === true || v === false) return v;
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return null;
  if (s === "SI" || s === "SÍ" || s === "TRUE" || s === "1") return true;
  if (s === "NO" || s === "FALSE" || s === "0") return false;
  return null;
}
