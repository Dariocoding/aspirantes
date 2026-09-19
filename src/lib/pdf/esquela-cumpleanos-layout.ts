/** Proporción del afiche ceremonial (igual a la plantilla). */
export const CUMPLEANOS_POSTER_ASPECT = 3 / 4;

/** Ancho A4 en puntos PDF; alto según 3:4 para no recortar la plantilla. */
export const CUMPLEANOS_PAGE_W = 595.28;
export const CUMPLEANOS_PAGE_H = CUMPLEANOS_PAGE_W / CUMPLEANOS_POSTER_ASPECT;

export const CUMPLEANOS_GOLD = {
  fill: "#e2bf3c",
  light: "#f6e79a",
  dark: "#c08a18",
  stroke: "#3d280c",
  css: "linear-gradient(180deg, #f6e79a 0%, #e2bf3c 40%, #c08a18 100%)",
  underCss:
    "radial-gradient(ellipse at 50% 38%, #f3e08a 0%, #e2bf3c 52%, #a87414 100%)",
} as const;

/**
 * Posiciones relativas sobre la plantilla (hueco bajo «felicitaciones a la» + corona).
 * Ajustar juntas en PDF y en la vista previa HTML.
 */
export const CUMPLEANOS_LAYOUT = {
  nameTopPct: 0.242,
  nameWidthPct: 0.945,
  photoWidthPct: 0.28,
  photoHeightPct: 0.335,
  photoCenterYPct: 0.478,
  nameLetterSpacingPt: 0,
  nameLetterSpacingEm: "0em",
  /** Relieve tipo «Feliz Cumpleaños»: un peldaño pequeño. */
  nameDepthEm: 0.032,
  nameStrokeEm: 0.034,
  /**
   * JPEG/PDF: el trazo CSS se ve más pesado en pantalla; al exportar (y con
   * submuestreo 4:2:0) hay que pintar más tinta o el nombre queda claro y fino.
   */
  nameExportStrokeEm: 0.078,
  nameExportFauxBoldEm: 0.02,
  nameExportShadowYEm: 0.048,
  nameExportShadowBlurEm: 0.07,
} as const;

const PARTICULAS = new Set(["de", "del", "la", "las", "los", "y", "e", "da", "do", "dos", "das"]);

export function titleCaseEs(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, i) => {
      const parts = word.split("-");
      return parts
        .map((part, j) => {
          const lower = part.toLocaleLowerCase("es");
          if (i > 0 && j === 0 && PARTICULAS.has(lower)) return lower;
          if (!lower) return lower;
          return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
        })
        .join("-");
    })
    .join(" ");
}

export function honoreeDisplayName(nombres: string, apellidos: string): string {
  const name = titleCaseEs(`${nombres.trim()} ${apellidos.trim()}`);
  return `Asp/Ofic ${name}`.replace(/\s+/g, " ").trim();
}

export type HonoreeNameLayout = {
  lines: string[];
  fontSize: number;
};

/** Great Vibes: los trazos se solapan; ~0.42 em por carácter. */
function scriptWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.42;
}

function wrapBalanced(text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ").filter(Boolean);
  if (words.length < 2 || scriptWidth(text, fontSize) <= maxWidth) return [text];

  let best: string[] = [text];
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const wa = scriptWidth(a, fontSize);
    const wb = scriptWidth(b, fontSize);
    if (wa > maxWidth || wb > maxWidth) continue;
    const score = Math.abs(wa - wb) + Math.max(0, wb - wa) * 0.15;
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}

export function layoutHonoreeName(full: string, maxWidth = CUMPLEANOS_PAGE_W * CUMPLEANOS_LAYOUT.nameWidthPct): HonoreeNameLayout {
  const text = full.replace(/\s+/g, " ").trim();
  let fontSize = 34;

  while (fontSize >= 22) {
    if (scriptWidth(text, fontSize) <= maxWidth) {
      return { lines: [text], fontSize };
    }
    fontSize -= 1;
  }

  while (fontSize >= 18) {
    const lines = wrapBalanced(text, fontSize, maxWidth);
    const longest = Math.max(...lines.map((l) => scriptWidth(l, fontSize)));
    if (longest <= maxWidth && lines.length <= 2) {
      return { lines, fontSize };
    }
    fontSize -= 1;
  }
  return { lines: wrapBalanced(text, 18, maxWidth), fontSize: 18 };
}

export function honoreeScriptFontSize(nombre: string): number {
  return layoutHonoreeName(nombre).fontSize;
}
