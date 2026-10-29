import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";

/** Primer día con marca; `null` si la persona no monta guardia. */
export function primerDiaMarca(dias: readonly MarcaDia[]): number | null {
  if (dias.length === 0) return null;
  let min = dias[0]!.dia;
  for (const item of dias) {
    if (item.dia < min) min = item.dia;
  }
  return min;
}

function marcaEnDia(dias: readonly MarcaDia[], dia: number): string {
  return dias.find((item) => item.dia === dia)?.marca ?? "";
}

/**
 * Orden de filas tipo escalera / diagonal:
 * primero quien empieza antes en el mes; sin marcas al final;
 * mismo día → turno T1/T2/T3; empate → orden actual.
 */
export function compararEscalera(
  a: { orden: number; dias: readonly MarcaDia[] },
  b: { orden: number; dias: readonly MarcaDia[] },
): number {
  const diaA = primerDiaMarca(a.dias);
  const diaB = primerDiaMarca(b.dias);
  if (diaA == null && diaB == null) return a.orden - b.orden;
  if (diaA == null) return 1;
  if (diaB == null) return -1;
  if (diaA !== diaB) return diaA - diaB;

  const turnoA = turnoDesdeMarca(marcaEnDia(a.dias, diaA));
  const turnoB = turnoDesdeMarca(marcaEnDia(b.dias, diaB));
  if (turnoA && turnoB && turnoA.orden !== turnoB.orden) return turnoA.orden - turnoB.orden;
  if (turnoA && !turnoB) return -1;
  if (!turnoA && turnoB) return 1;
  return a.orden - b.orden;
}

/** Devuelve una copia ordenada en escalera con `orden` 1..n. */
export function ordenarAsignacionesEscalera<T extends { orden: number; dias: readonly MarcaDia[] }>(
  asignaciones: readonly T[],
): T[] {
  const ordenadas = [...asignaciones].sort(compararEscalera);
  return ordenadas.map((item, index) =>
    item.orden === index + 1 ? item : { ...item, orden: index + 1 },
  );
}
