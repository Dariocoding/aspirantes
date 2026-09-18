export const COLOR_CABELLO_VALUES = [
  "NEGRO",
  "CASTANO_CLARO",
  "CASTANO_OSCURO",
  "RUBIO",
  "ROJIZO",
  "CANOSO",
] as const;

export const FORMA_LABIOS_VALUES = [
  "VOLUMINOSOS",
  "FINOS",
  "GRUESO_EN_EL_CENTRO",
  "NORMALES",
  "AUMENTADOS",
] as const;

export const FORMA_NARIZ_VALUES = ["PEQUENA", "PERFILADA", "ANCHA", "ARQUEADA", "GRANDE"] as const;

export const COLOR_OJOS_VALUES = ["CAFE", "AMBAR", "AVELLANA", "VERDE", "AZUL", "GRIS", "NEGRO"] as const;

export const COLOR_PIEL_VALUES = ["CLARA", "MORENA", "MARRON", "NEGRA"] as const;

export const TIPO_SANGRE_GRUPO_VALUES = ["A", "B", "AB", "O"] as const;

export const FACTOR_RH_VALUES = ["POSITIVO", "NEGATIVO"] as const;

export const SENA_PARTICULAR_VALUES = [
  "LUNARES",
  "CICATRIZ",
  "BERRUGA",
  "MANCHAS_DE_LA_PIEL",
  "LESIONES",
  "TATUAJE",
  "NINGUNA",
] as const;

export type ColorCabelloValue = (typeof COLOR_CABELLO_VALUES)[number];
export type FormaLabiosValue = (typeof FORMA_LABIOS_VALUES)[number];
export type FormaNarizValue = (typeof FORMA_NARIZ_VALUES)[number];
export type ColorOjosValue = (typeof COLOR_OJOS_VALUES)[number];
export type ColorPielValue = (typeof COLOR_PIEL_VALUES)[number];
export type TipoSangreGrupoValue = (typeof TIPO_SANGRE_GRUPO_VALUES)[number];
export type FactorRhValue = (typeof FACTOR_RH_VALUES)[number];
export type SenaParticularValue = (typeof SENA_PARTICULAR_VALUES)[number];

export const COLOR_CABELLO_LABELS: Record<ColorCabelloValue, string> = {
  NEGRO: "Negro",
  CASTANO_CLARO: "Castaño claro",
  CASTANO_OSCURO: "Castaño oscuro",
  RUBIO: "Rubio",
  ROJIZO: "Rojizo",
  CANOSO: "Canoso",
};

export const FORMA_LABIOS_LABELS: Record<FormaLabiosValue, string> = {
  VOLUMINOSOS: "Voluminosos",
  FINOS: "Finos",
  GRUESO_EN_EL_CENTRO: "Grueso en el centro",
  NORMALES: "Normales",
  AUMENTADOS: "Aumentados",
};

export const FORMA_NARIZ_LABELS: Record<FormaNarizValue, string> = {
  PEQUENA: "Pequeña",
  PERFILADA: "Perfilada",
  ANCHA: "Ancha",
  ARQUEADA: "Arqueada",
  GRANDE: "Grande",
};

export const COLOR_OJOS_LABELS: Record<ColorOjosValue, string> = {
  CAFE: "Café",
  AMBAR: "Ámbar",
  AVELLANA: "Avellana",
  VERDE: "Verde",
  AZUL: "Azul",
  GRIS: "Gris",
  NEGRO: "Negro",
};

export const COLOR_PIEL_LABELS: Record<ColorPielValue, string> = {
  CLARA: "Clara",
  MORENA: "Morena",
  MARRON: "Marrón",
  NEGRA: "Negra",
};

export const TIPO_SANGRE_GRUPO_LABELS: Record<TipoSangreGrupoValue, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
};

export const FACTOR_RH_LABELS: Record<FactorRhValue, string> = {
  POSITIVO: "Positivo",
  NEGATIVO: "Negativo",
};

export const SENA_PARTICULAR_LABELS: Record<SenaParticularValue, string> = {
  LUNARES: "Lunares",
  CICATRIZ: "Cicatriz",
  BERRUGA: "Verruga",
  MANCHAS_DE_LA_PIEL: "Manchas de la piel",
  LESIONES: "Lesiones",
  TATUAJE: "Tatuaje",
  NINGUNA: "Ninguna",
};

export const RED_SOCIAL_NO_POSEE = "NO_POSEE";

function isCatalogValue<T extends readonly string[]>(values: T, v: string | null | undefined): v is T[number] {
  return Boolean(v && (values as readonly string[]).includes(v));
}

export function isColorCabello(v: string | null | undefined): v is ColorCabelloValue {
  return isCatalogValue(COLOR_CABELLO_VALUES, v);
}
export function isFormaLabios(v: string | null | undefined): v is FormaLabiosValue {
  return isCatalogValue(FORMA_LABIOS_VALUES, v);
}
export function isFormaNariz(v: string | null | undefined): v is FormaNarizValue {
  return isCatalogValue(FORMA_NARIZ_VALUES, v);
}
export function isColorOjos(v: string | null | undefined): v is ColorOjosValue {
  return isCatalogValue(COLOR_OJOS_VALUES, v);
}
export function isColorPiel(v: string | null | undefined): v is ColorPielValue {
  return isCatalogValue(COLOR_PIEL_VALUES, v);
}
export function isTipoSangreGrupo(v: string | null | undefined): v is TipoSangreGrupoValue {
  return isCatalogValue(TIPO_SANGRE_GRUPO_VALUES, v);
}
export function isFactorRh(v: string | null | undefined): v is FactorRhValue {
  return isCatalogValue(FACTOR_RH_VALUES, v);
}
export function isSenaParticular(v: string | null | undefined): v is SenaParticularValue {
  return isCatalogValue(SENA_PARTICULAR_VALUES, v);
}

/**
 * Compacta variantes libres ("O positivo", "Orh+", "ORH+", "0+") a un token ABO ±.
 * Quita "POSITIVO"/"RH" antes de buscar la letra O, para no confundirla con esas palabras.
 */
function compactTipoSangreToken(raw: string): string {
  let n = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase();
  n = n.replace(/POSITIVO/g, "+");
  n = n.replace(/NEGATIVO/g, "-");
  n = n.replace(/\bPOS\b/g, "+");
  n = n.replace(/\bNEG\b/g, "-");
  n = n.replace(/[-–—−]/g, "-");
  n = n.replace(/R\s*H/g, "RH");
  n = n.replace(/RH\s*\+/g, "+");
  n = n.replace(/RH\s*[-–—]/g, "-");
  n = n.replace(/RH/g, "");
  n = n.replace(/GRUPO\s*SANGUINEO|TIPO\s*DE\s*SANGRE|TIPO\s*SANGRE|SANGRE|GRUPO|FACTOR/g, "");
  n = n.replace(/[^ABO0+\-]/g, "");
  n = n.replace(/0/g, "O");
  return n;
}

function isBlankSangre(raw: string | null | undefined): boolean {
  const t = raw?.trim() ?? "";
  return !t || /^[—–\-]+$/.test(t) || t.toLowerCase() === "n/a" || t.toLowerCase() === "na";
}

export function parseTipoSangreGrupo(raw: string | null | undefined): TipoSangreGrupoValue | null {
  if (raw == null || isBlankSangre(raw)) return null;
  const n = compactTipoSangreToken(raw);
  if (!n) return null;
  if (n.includes("AB")) return "AB";
  if (n.includes("A")) return "A";
  if (n.includes("B")) return "B";
  if (n.includes("O")) return "O";
  return null;
}

export function parseFactorRh(raw: string | null | undefined): FactorRhValue | null {
  if (raw == null || isBlankSangre(raw)) return null;
  const folded = raw.trim().toUpperCase();
  if (isFactorRh(folded)) return folded;
  const n = compactTipoSangreToken(raw);
  if (n.includes("+")) return "POSITIVO";
  if (n.includes("-")) return "NEGATIVO";
  return null;
}

export function splitTipoSangreFields(
  raw: string | null | undefined,
  factorRh?: string | null,
): { tipoSangre: TipoSangreGrupoValue | null; factorRh: FactorRhValue | null } {
  const tipoSangre = parseTipoSangreGrupo(raw);
  const rh = parseFactorRh(factorRh) ?? parseFactorRh(raw);
  return { tipoSangre, factorRh: rh };
}

export function formatTipoSangre(
  grupo: string | null | undefined,
  factorRh: string | null | undefined,
): string | null {
  const { tipoSangre: g, factorRh: rh } = splitTipoSangreFields(grupo, factorRh);
  if (!g && !rh) return grupo?.trim() || null;
  if (!g) return rh ? FACTOR_RH_LABELS[rh] : null;
  if (!rh) return g;
  return `${g}${rh === "POSITIVO" ? "+" : "-"}`;
}

/**
 * Persistencia: grupo solo A/B/AB/O y RH solo POSITIVO/NEGATIVO.
 * Si hay grupo y falta el factor, se asume positivo.
 */
export function homologarDatosSangre(
  tipoSangre: string | null | undefined,
  factorRh?: string | null,
  defaultRh: FactorRhValue | null = "POSITIVO",
): { tipoSangre: TipoSangreGrupoValue | null; factorRh: FactorRhValue | null } {
  const { tipoSangre: g, factorRh: rh } = splitTipoSangreFields(tipoSangre, factorRh);
  if (!g) return { tipoSangre: null, factorRh: rh };
  return { tipoSangre: g, factorRh: rh ?? defaultRh };
}

/** Excel/censo: siempre A+/A-/B+/B-/AB+/AB-/O+. Si hay grupo y falta RH, se asume positivo. */
export function formatTipoSangreHomologado(
  grupo: string | null | undefined,
  factorRh: string | null | undefined,
  defaultRh: FactorRhValue = "POSITIVO",
): string | null {
  const { tipoSangre: g, factorRh: rh } = homologarDatosSangre(grupo, factorRh, defaultRh);
  if (!g) return null;
  const sign = rh === "NEGATIVO" ? "-" : "+";
  return `${g}${sign}`;
}

export function labelRedSocial(v: string | null | undefined): string | null {
  if (!v?.trim()) return null;
  if (v.trim() === RED_SOCIAL_NO_POSEE) return "No posee redes sociales";
  return v.trim();
}

export function redSocialModo(v: string | null | undefined): "" | "NO_POSEE" | "POSEE" {
  if (!v?.trim()) return "";
  if (v.trim() === RED_SOCIAL_NO_POSEE) return "NO_POSEE";
  return "POSEE";
}

export function redSocialUsuario(v: string | null | undefined): string {
  if (!v?.trim() || v.trim() === RED_SOCIAL_NO_POSEE) return "";
  return v.trim();
}

export function composeRedSocial(modo: string | null | undefined, usuario: string | null | undefined): string | null {
  if (modo === "NO_POSEE") return RED_SOCIAL_NO_POSEE;
  const u = usuario?.trim();
  if (u === RED_SOCIAL_NO_POSEE) return RED_SOCIAL_NO_POSEE;
  if (modo === "POSEE") return u || null;
  return u || null;
}
