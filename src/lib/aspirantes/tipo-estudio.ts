export const TIPO_ESTUDIO_VALUES = [
  "TSU",
  "PREGRADO",
  "ESPECIALIZACION",
  "MAESTRIA",
  "DOCTORADO",
] as const;

/** Incluye valores legacy de BD. */
export const TIPO_ESTUDIO_ALL_VALUES = [...TIPO_ESTUDIO_VALUES, "UNIVERSIDAD", "BACHILLER"] as const;

export type TipoEstudioValue = (typeof TIPO_ESTUDIO_VALUES)[number];
export type TipoEstudioStored = (typeof TIPO_ESTUDIO_ALL_VALUES)[number];

export const TIPO_ESTUDIO_LABELS: Record<TipoEstudioValue, string> = {
  TSU: "TSU (Técnico Superior Universitario)",
  PREGRADO: "Pregrado (Licenciatura / equivalente)",
  ESPECIALIZACION: "Especialización (postgrado)",
  MAESTRIA: "Maestría",
  DOCTORADO: "Doctorado",
};

/** Etiqueta corta para listados y ficha técnica. */
export const TIPO_ESTUDIO_SHORT_LABELS: Record<TipoEstudioValue, string> = {
  TSU: "TSU",
  PREGRADO: "Pregrado",
  ESPECIALIZACION: "Especialización",
  MAESTRIA: "Maestría",
  DOCTORADO: "Doctorado",
};

export const TIPO_ESTUDIO_PDF_LABELS: Record<TipoEstudioValue, string> = {
  TSU: "TSU",
  PREGRADO: "PREGRADO",
  ESPECIALIZACION: "ESPECIALIZACIÓN",
  MAESTRIA: "MAESTRÍA",
  DOCTORADO: "DOCTORADO",
};

/** Normaliza valores legacy → opción vigente (o null si no aplica). */
export function normalizeTipoEstudio(
  v: string | null | undefined,
): TipoEstudioValue | null {
  if (v == null || v === "") return null;
  if (v === "UNIVERSIDAD") return "PREGRADO";
  if (v === "BACHILLER") return null;
  if ((TIPO_ESTUDIO_VALUES as readonly string[]).includes(v)) {
    return v as TipoEstudioValue;
  }
  return null;
}

export function isTipoEstudioValue(v: string | null | undefined): v is TipoEstudioValue {
  return v != null && (TIPO_ESTUDIO_VALUES as readonly string[]).includes(v);
}

export function labelTipoEstudio(v: string | null | undefined): string | null {
  const n = normalizeTipoEstudio(v);
  return n ? TIPO_ESTUDIO_LABELS[n] : null;
}

export function labelTipoEstudioShort(v: string | null | undefined): string | null {
  const n = normalizeTipoEstudio(v);
  return n ? TIPO_ESTUDIO_SHORT_LABELS[n] : null;
}

export function labelTipoEstudioPdf(v: string | null | undefined): string | null {
  const n = normalizeTipoEstudio(v);
  return n ? TIPO_ESTUDIO_PDF_LABELS[n] : null;
}
