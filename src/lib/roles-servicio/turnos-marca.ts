/**
 * Guardia de estacionamiento: la celda no es una X de servicio.
 * T1 = primer turno, T2 = segundo turno, T3 = tercer turno. Solo nocturno.
 */

export const TURNOS_EN_MARCA = {
  T1: { etiqueta: "1ER", nombre: "Primer turno", orden: 0 },
  T2: { etiqueta: "2DO", nombre: "Segundo turno", orden: 1 },
  T3: { etiqueta: "3ER", nombre: "Tercer turno", orden: 2 },
} as const;

export type MarcaTurno = keyof typeof TURNOS_EN_MARCA;

export type TurnoEnMarca = (typeof TURNOS_EN_MARCA)[MarcaTurno];

export function turnoDesdeMarca(marca: string): TurnoEnMarca | null {
  const clave = marca.trim().toUpperCase();
  if (clave === "T1" || clave === "T2" || clave === "T3") return TURNOS_EN_MARCA[clave];
  return null;
}

/** Roles cuyo turno sale de la marca (T1/T2/T3) y no del binomio de la orden. */
export function esRolConTurnoEnMarca(nombreRol: string): boolean {
  return /estacionamiento/i.test(nombreRol);
}

export function etiquetaServicioTurnoEnMarca(nombreRol: string): string {
  const limpio = nombreRol
    .replace(/\bnocturn[oa]\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .toUpperCase();
  return limpio || "GUARDIA ESTACIONAMIENTO";
}
