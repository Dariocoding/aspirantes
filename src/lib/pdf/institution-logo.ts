import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Buffer PNG del logo institucional para @react-pdf (solo JPEG/PNG; el WebP de `public/` no es válido).
 * Colocar `public/images/ejercito_logo_print.png` (exportación desde el logo oficial).
 *
 * Resuelve la carpeta desde este módulo (sin `process.cwd()`) para evitar trazar todo el repo en NFT/Turbopack.
 */
export function readInstitutionLogoPngBuffer(): Buffer | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const imagesDir = path.resolve(here, "../../../public/images");
  const candidates = [
    path.join(imagesDir, "ejercito_logo_print.png"),
    path.join(imagesDir, "ejercito_logo.png"),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
  }
  return null;
}
