import { readFileSync } from "node:fs";
import path from "node:path";
import type { MembreteLogoKind } from "@src/lib/membrete";

/**
 * Buffer PNG del logo institucional para @react-pdf (solo JPEG/PNG; el WebP de `public/` no es válido).
 * Preferir `public/images/cefoa-logo.png`.
 *
 * `readFileSync(path.join(process.cwd(), "public", "images", …))` debe ir en una sola
 * expresión: si la ruta se guarda en una variable, Turbopack traza todo el repo (NFT).
 */
export function readInstitutionLogoPngBuffer(): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "cefoa-logo.png"));
  } catch {
    return null;
  }
}

export function readEjercitoLogoPngBuffer(): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "ejercito-logo.png"));
  } catch {
    return null;
  }
}

/** Escudo CEFOA del formato de boleta (fondo transparente). */
export function readBoletaCefoaLogoPngBuffer(): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "boleta-cefoa.png"));
  } catch {
    return readInstitutionLogoPngBuffer();
  }
}

/** Escudo del Ejército del formato de boleta (fondo transparente). */
export function readBoletaEjercitoLogoPngBuffer(): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "boleta-ejercito.png"));
  } catch {
    return readEjercitoLogoPngBuffer();
  }
}

export function readMembreteLogoPngBuffer(kind: MembreteLogoKind): Buffer | null {
  if (kind === "cefoa") return readInstitutionLogoPngBuffer();
  if (kind === "ejercito") return readEjercitoLogoPngBuffer();
  return null;
}
