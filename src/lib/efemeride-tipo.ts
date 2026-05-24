/** Valores permitidos para Efemeride.tipo (calendario institucional). */
export const EFEMERIDE_TIPO_ENUM = [
  "NACIONAL",
  "FERIADO",
  "PATRIO",
  "HISTORICO",
  "CULTURAL",
  "PROFESIONAL",
  "RELIGIOSO",
] as const;

export type EfemerideTipo = (typeof EFEMERIDE_TIPO_ENUM)[number];

const TIPO_ETIQUETA: Record<EfemerideTipo, string> = {
  NACIONAL: "Nacional",
  FERIADO: "Feriado",
  PATRIO: "Patrio",
  HISTORICO: "Histórico",
  CULTURAL: "Cultural",
  PROFESIONAL: "Profesional",
  RELIGIOSO: "Religioso",
};

export const EFEMERIDE_TIPO_OPCIONES: ReadonlyArray<{ value: EfemerideTipo; label: string }> =
  EFEMERIDE_TIPO_ENUM.map((value) => ({ value, label: TIPO_ETIQUETA[value] }));

export function labelEfemerideTipo(tipo: string): string {
  const key = tipo.toUpperCase() as EfemerideTipo;
  if (key in TIPO_ETIQUETA) return TIPO_ETIQUETA[key];
  const t = tipo.toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : tipo;
}

export function normalizeEfemerideTipo(tipo: string): EfemerideTipo {
  const key = tipo.toUpperCase() as EfemerideTipo;
  return key in TIPO_ETIQUETA ? key : "NACIONAL";
}
