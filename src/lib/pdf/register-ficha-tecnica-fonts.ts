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
  Font.register({
    family: FICHA_TECNICA_PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(process.cwd(), "assets", "fonts", "Arial.ttf"), fontWeight: "normal" },
      { src: path.join(process.cwd(), "assets", "fonts", "Arial-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  registered = true;
}
