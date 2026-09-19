/** Estatura adulta razonable en centímetros (FANB / censo). */
export const ESTATURA_CM_MIN = 100;
export const ESTATURA_CM_MAX = 250;

/**
 * Homologa estatura a centímetros.
 * Acepta 180, 1.80, 1,6, "1,65 m", "165cm".
 * Metros (~1.2–2.5) → ×100. Dos dígitos (p. ej. 66) = 1 m + cm → 166.
 */
export function homologarEstaturaCm(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && !Number.isFinite(raw)) return null;
  const t = String(raw).trim().toLowerCase();
  if (!t) return null;
  const hasMeterUnit = /(?:^|[^a-z])m(?:etros?)?(?:$|[^a-z])/i.test(t) && !/\bcm\b/.test(t);
  const n = Number(t.replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;

  let cm = n;
  if (hasMeterUnit || n < 3) cm = n * 100;
  else if (n >= 50 && n < 100) cm = 100 + n;
  cm = Math.round(cm);
  if (cm < ESTATURA_CM_MIN || cm > ESTATURA_CM_MAX) return null;
  return cm;
}

export function formatEstaturaCm(raw: unknown): string | null {
  const cm = homologarEstaturaCm(raw);
  return cm == null ? null : String(cm);
}
