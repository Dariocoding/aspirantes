import path from "node:path";
import { Font } from "@react-pdf/renderer";

/** Familia Arial embebida para ficha técnica (archivos en `public/fonts/`). */
export const FICHA_TECNICA_PDF_FONT_FAMILY = "Arial";

let registered = false;

/**
 * Registra Arial Regular + Bold para @react-pdf.
 * Idempotente por proceso Node.
 */
export function registerFichaTecnicaPdfFonts(): void {
  if (registered) return;
  const dir = path.join(/*turbopackIgnore: true*/ process.cwd(), "assets", "fonts");
  Font.register({
    family: FICHA_TECNICA_PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(/*turbopackIgnore: true*/ dir, "Arial.ttf"), fontWeight: "normal" },
      { src: path.join(/*turbopackIgnore: true*/ dir, "Arial-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  registered = true;
}
