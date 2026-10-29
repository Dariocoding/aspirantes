import type { Sexo } from "@src/generated/prisma";

export type SubdivisionRol = {
  /** Sexo exigido por el nombre del rol; null = no distingue. */
  sexo: Sexo | null;
  /** Número de pelotón (1, 2…); null = el rol no lo limita. */
  pelotonNumero: number | null;
};

/**
 * Lee sexo y pelotón del título del rol.
 * Ej.: «GUARDIA BAÑO FEMENINA DEL 1ER PELOTÓN» → femenino + 1.
 * «COMEDOR MASCULINO» → masculino, sin pelotón.
 * «INSPECCIÓN DEL 2DO PELOTÓN» → pelotón 2, sin sexo.
 */
export function subdivisionDesdeNombreRol(nombre: string): SubdivisionRol {
  const texto = nombre.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

  let sexo: Sexo | null = null;
  if (/\bfemenin[oa]\b/.test(texto) || /\bcuartelera\b/.test(texto)) {
    sexo = "FEMENINO";
  } else if (/\bmasculin[oa]\b/.test(texto) || /\bcuartelero\b/.test(texto)) {
    sexo = "MASCULINO";
  }

  const peloton =
    texto.match(
      /(?:del\s+)?(\d+)\s*(?:er|do|ro|to|mo|o|º|°)?\s*peloton/,
    ) ?? texto.match(/\b(\d+)\s*(?:er|do|ro|to|mo)\b(?!\s*turno)/);

  let pelotonNumero: number | null = null;
  if (peloton?.[1]) {
    const n = Number(peloton[1]);
    if (Number.isInteger(n) && n >= 1 && n <= 40) pelotonNumero = n;
  }

  return { sexo, pelotonNumero };
}

export function etiquetaSubdivision(sub: SubdivisionRol): string {
  const partes: string[] = [];
  if (sub.sexo === "FEMENINO") partes.push("femeninas");
  if (sub.sexo === "MASCULINO") partes.push("masculinos");
  if (sub.pelotonNumero != null) {
    partes.push(
      sub.pelotonNumero === 1
        ? "1er pelotón"
        : sub.pelotonNumero === 2
          ? "2do pelotón"
          : `${sub.pelotonNumero}º pelotón`,
    );
  }
  return partes.join(" · ");
}
