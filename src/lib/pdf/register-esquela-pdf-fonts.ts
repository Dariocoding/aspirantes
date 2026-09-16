import path from "node:path";
import { Font } from "@react-pdf/renderer";

/** Familia registrada para PDFs de esquela (coincide con `public/fonts/`). */
export const ESQUELA_PDF_FONT_FAMILY = "Urbanist";

/** Caligrafía del nombre en el afiche de cumpleaños (Google Fonts, OFL). */
export const ESQUELA_SCRIPT_FONT_FAMILY = "Satisfy";

let registered = false;

/**
 * Registra Urbanist y Satisfy (Google Fonts, OFL) para @react-pdf.
 * Idempotente por proceso Node.
 */
export function registerEsquelaPdfFonts(): void {
  if (registered) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: ESQUELA_PDF_FONT_FAMILY,
    fonts: [
      { src: path.join(dir, "Urbanist-wght.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "Urbanist-wght.ttf"), fontWeight: 700 },
      { src: path.join(dir, "Urbanist-wght.ttf"), fontWeight: "bold" },
      { src: path.join(dir, "Urbanist-wght.ttf"), fontWeight: 800 },
      {
        src: path.join(dir, "Urbanist-Italic-wght.ttf"),
        fontWeight: "normal",
        fontStyle: "italic",
      },
    ],
  });
  Font.register({
    family: ESQUELA_SCRIPT_FONT_FAMILY,
    src: path.join(dir, "Satisfy-Regular.woff"),
  });
  registered = true;
}
