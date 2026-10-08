/**
 * Clasificación diurno / nocturno para filas de la Orden del Día.
 * Extender los patrones si aparecen nuevos nombres de rol en el Excel.
 */

export type TurnoServicio = "diurno" | "nocturno";

const PATRON_NOCTURNO =
  /ronda|imaginaria|nocturn|sereno|guardia\s*noct|vela|cuarteler[ao]\s*noct/i;

const ETIQUETAS_TURNO = ["1ER", "2DO", "3ER", "4TO", "5TO", "6TO"] as const;

export function clasificarTurnoServicio(nombreRol: string): TurnoServicio {
  if (PATRON_NOCTURNO.test(nombreRol)) return "nocturno";
  return "diurno";
}

/** Turno 1ER/2DO/3ER a partir del orden de la persona o del nombre del rol. */
export function etiquetaTurnoServicio(nombreRol: string, orden: number): string {
  const desdeNombre = nombreRol.match(/\b(1ER|2DO|3ER|4TO|5TO|6TO|1[ºo°]|2[ºo°]|3[ºo°])\b/i);
  if (desdeNombre?.[1]) {
    const t = desdeNombre[1].toUpperCase();
    if (t.startsWith("1")) return "1ER";
    if (t.startsWith("2")) return "2DO";
    if (t.startsWith("3")) return "3ER";
    return t;
  }
  const idx = Math.max(0, orden - 1) % ETIQUETAS_TURNO.length;
  return ETIQUETAS_TURNO[idx]!;
}
