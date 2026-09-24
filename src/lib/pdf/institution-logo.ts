import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { MembreteLogoKind } from "@src/lib/membrete";

/**
 * Ruta relativa al cwd. @react-pdf la resuelve una vez y reutiliza la imagen
 * en todas las boletas. Un Buffer por carnet obliga a decodificar el PNG entero
 * en cada uno y, en una convocatoria completa, tumba el proceso (502).
 */
function publicImageUri(fileName: string): string | null {
  const absolute = path.join(process.cwd(), "public", "images", fileName);
  if (!existsSync(absolute)) return null;
  return `public/images/${fileName}`;
}

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

/**
 * Escudo CEFOA de la boleta. Se usa el PNG institucional (500×500, fondo
 * transparente): `boleta-cefoa.png` estaba estirado en vertical.
 */
export function readBoletaCefoaLogoPngBuffer(): Buffer | null {
  return readInstitutionLogoPngBuffer();
}

export function boletaCefoaLogoUri(): string | null {
  return publicImageUri("cefoa-logo.png");
}

/**
 * Escudo del Ejército de la boleta. Se usa el PNG institucional (608×900,
 * fondo transparente): `boleta-ejercito.png` estaba comprimido en horizontal.
 */
export function readBoletaEjercitoLogoPngBuffer(): Buffer | null {
  return readEjercitoLogoPngBuffer();
}

export function boletaEjercitoLogoUri(): string | null {
  return publicImageUri("ejercito-logo.png");
}

/** Franja vertical de la Bandera Nacional (anverso de la boleta). */
export function readBoletaBanderaJpgBuffer(): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "images", "bandera-de-venezuela.jpg"));
  } catch {
    return null;
  }
}

export function boletaBanderaUri(): string | null {
  return publicImageUri("bandera-de-venezuela.jpg");
}

export function readMembreteLogoPngBuffer(kind: MembreteLogoKind): Buffer | null {
  if (kind === "cefoa") return readInstitutionLogoPngBuffer();
  if (kind === "ejercito") return readEjercitoLogoPngBuffer();
  return null;
}
