import fs from "node:fs";
import path from "node:path";

/**
 * Buffer PNG del logo institucional para @react-pdf (solo JPEG/PNG; el WebP de `public/` no es válido).
 * Colocar `public/images/ejercito_logo_print.png` (exportación desde el logo oficial).
 */
export function readInstitutionLogoPngBuffer(): Buffer | null {
  const candidates = [
    path.join(process.cwd(), "public", "images", "ejercito_logo_print.png"),
    path.join(process.cwd(), "public", "images", "ejercito_logo.png"),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  }
  return null;
}
