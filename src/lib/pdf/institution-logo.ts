import fs from "node:fs";
import path from "node:path";

/**
 * Buffer PNG del logo institucional para @react-pdf (solo JPEG/PNG; el WebP de `public/` no es válido).
 * Preferir `public/images/cefoa-logo.png`. Fallback: logos del Ejército.
 */
export function readInstitutionLogoPngBuffer(): Buffer | null {
  // Rutas literales bajo `public/images` para que Turbopack no tracee todo el repo.
  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "images", "cefoa-logo.png"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "images", "ejercito_logo_print.png"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "images", "ejercito_logo.png"),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  }
  return null;
}
