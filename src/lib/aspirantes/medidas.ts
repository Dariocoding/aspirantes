/** Estatura adulta razonable en metros. */
export const ESTATURA_M_MIN = 1;
export const ESTATURA_M_MAX = 2.5;

/** @deprecated Use ESTATURA_M_MIN */
export const ESTATURA_CM_MIN = ESTATURA_M_MIN;
/** @deprecated Use ESTATURA_M_MAX */
export const ESTATURA_CM_MAX = ESTATURA_M_MAX;

function roundMeters(m: number): number {
  return Math.round(m * 100) / 100;
}

/**
 * Homologa estatura a metros (1,80).
 * Acepta 1,6 / 1.80 / 180 cm / 66 (1 m 66).
 */
export function homologarEstaturaM(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && !Number.isFinite(raw)) return null;
  const t = String(raw).trim().toLowerCase();
  if (!t) return null;
  const n = Number(t.replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;

  let meters = n;
  if (n >= 50 && n < 100) meters = (100 + n) / 100;
  else if (n >= 100 && n <= 250) meters = n / 100;
  else if (n >= ESTATURA_M_MIN && n <= ESTATURA_M_MAX) meters = n;
  else return null;

  meters = roundMeters(meters);
  if (meters < ESTATURA_M_MIN || meters > ESTATURA_M_MAX) return null;
  return meters;
}

/** Alias: el campo Prisma sigue llamándose `estaturaCm`, pero el valor es en metros. */
export const homologarEstaturaCm = homologarEstaturaM;

export function formatEstaturaM(raw: unknown): string | null {
  const m = homologarEstaturaM(raw);
  if (m == null) return null;
  return m.toFixed(2).replace(".", ",");
}

export const formatEstaturaCm = formatEstaturaM;

export function estaturaInputValue(raw: unknown): string {
  const m = homologarEstaturaM(raw);
  return m == null ? "" : m.toFixed(2);
}
