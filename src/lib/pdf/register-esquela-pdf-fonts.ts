import path from "node:path";
import { Font } from "@react-pdf/renderer";

/** Familia registrada para PDFs de esquela (coincide con `public/fonts/`). */
export const ESQUELA_PDF_FONT_FAMILY = "Urbanist";

/** Caligrafía del nombre en el afiche de cumpleaños (Google Fonts, OFL). */
export const ESQUELA_SCRIPT_FONT_FAMILY = "GreatVibes";

let registered = false;

/**
 * Registra Urbanist y Great Vibes (Google Fonts, OFL) para @react-pdf.
 * Idempotente por proceso Node.
 */
export function registerEsquelaPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: ESQUELA_PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(process.cwd(), "public", "fonts", "Urbanist-wght.ttf"), fontWeight: "normal" },
      { src: path.join(process.cwd(), "public", "fonts", "Urbanist-wght.ttf"), fontWeight: 700 },
      { src: path.join(process.cwd(), "public", "fonts", "Urbanist-wght.ttf"), fontWeight: "bold" },
      { src: path.join(process.cwd(), "public", "fonts", "Urbanist-wght.ttf"), fontWeight: 800 },
      {
        src: path.join(process.cwd(), "public", "fonts", "Urbanist-Italic-wght.ttf"),
        fontWeight: "normal",
        fontStyle: "italic",
      },
    ],
  });
  Font.register({
    family: ESQUELA_SCRIPT_FONT_FAMILY,
    src: path.join(process.cwd(), "public", "fonts", "GreatVibes-Regular.ttf"),
  });
  registered = true;
}
