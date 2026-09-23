export const MEMBRETE_LOGO_KINDS = ["none", "cefoa", "ejercito"] as const;
export type MembreteLogoKind = (typeof MEMBRETE_LOGO_KINDS)[number];

export const MEMBRETE_NONE_ID = "none";
export const MAX_MEMBRETE_LINEAS = 8;

export const PLANTILLA_MEMBRETE_CEFOA45: readonly string[] = [
  "República Bolivariana de Venezuela",
  "Ministerio del Poder Popular para la Defensa",
  "Ejército Bolivariano",
  "Dirección de Educación del Ejército",
  "Curso Especial de Formación de Oficiales en las Categoría de Asimilado y Asimilado Técnico Nro. 46",
];

export type MembreteSpec = {
  lineas: string[];
  logoIzq: MembreteLogoKind;
  logoDer: MembreteLogoKind;
};

export type MembreteOption = {
  id: string;
  nombre: string;
  isDefault: boolean;
};

export function isMembreteLogoKind(value: string): value is MembreteLogoKind {
  return (MEMBRETE_LOGO_KINDS as readonly string[]).includes(value);
}

export function parseMembreteLineas(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_MEMBRETE_LINEAS);
}

export function membreteLineasToText(lineas: readonly string[]): string {
  return lineas.join("\n");
}

export function defaultMembreteOptionId(options: readonly MembreteOption[]): string {
  return options.find((m) => m.isDefault)?.id ?? MEMBRETE_NONE_ID;
}
