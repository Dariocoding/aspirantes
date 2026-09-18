import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Buffer PNG del logo institucional para @react-pdf (solo JPEG/PNG; el WebP de `public/` no es válido).
 * Preferir `public/images/cefoa-logo.png`. Fallback: logos del Ejército.
 *
 * `readFileSync(path.join(process.cwd(), "public", "images", …))` debe ir en una sola
 * expresión: si la ruta se guarda en una variable, Turbopack traza todo el repo (NFT).
 */
export function readInstitutionLogoPngBuffer(): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "cefoa-logo.png"));
  } catch {
    /* fallback */
  }
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "ejercito_logo_print.png"));
  } catch {
    /* fallback */
  }
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "ejercito_logo.png"));
  } catch {
    return null;
  }
}
