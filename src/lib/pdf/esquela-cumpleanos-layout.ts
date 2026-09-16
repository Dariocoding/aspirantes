/** Proporción del afiche ceremonial (igual a la plantilla). */
export const CUMPLEANOS_POSTER_ASPECT = 3 / 4;

/** Ancho A4 en puntos PDF; alto según 3:4 para no recortar la plantilla. */
export const CUMPLEANOS_PAGE_W = 595.28;
export const CUMPLEANOS_PAGE_H = CUMPLEANOS_PAGE_W / CUMPLEANOS_POSTER_ASPECT;

export const CUMPLEANOS_GOLD = {
  fill: "#c9a227",
  light: "#ddc06a",
  dark: "#8a6414",
  stroke: "#3a2a0c",
  css: "linear-gradient(180deg, #ddc06a 0%, #c9a227 42%, #8a6414 100%)",
  underCss:
    "radial-gradient(ellipse at 50% 38%, #e6d392 0%, #c9a227 52%, #6e5214 100%)",
} as const;

/**
 * Posiciones relativas sobre la plantilla (hueco bajo «felicitaciones a la» + corona).
 * Ajustar juntas en PDF y en la vista previa HTML.
 */
export const CUMPLEANOS_LAYOUT = {
  nameTopPct: 0.236,
  nameWidthPct: 0.9,
  photoWidthPct: 0.28,
  photoHeightPct: 0.335,
  photoCenterYPct: 0.478,
  nameLetterSpacingPt: 0.15,
  nameLetterSpacingEm: "0.01em",
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
  rank: string;
  lines: string[];
  fontSize: number;
};

/** Satisfy (script) ~0.42 em por carácter. */
function scriptWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.42;
}

function wrapWords(text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (scriptWidth(next, fontSize) <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

export function layoutHonoreeName(full: string, maxWidth = CUMPLEANOS_PAGE_W * CUMPLEANOS_LAYOUT.nameWidthPct): HonoreeNameLayout {
  const rank = "Asp/Ofic";
  const name = full.replace(/^Asp\s*\/\s*Ofic\s+/i, "").trim();
  let fontSize = 36;
  if (name.length > 42) fontSize = 26;
  else if (name.length > 32) fontSize = 30;
  else if (name.length > 22) fontSize = 34;

  while (fontSize > 18) {
    const lines = wrapWords(name, fontSize, maxWidth);
    const longest = Math.max(scriptWidth(rank, fontSize), ...lines.map((l) => scriptWidth(l, fontSize)));
    if (longest <= maxWidth && lines.length <= 3) {
      return { rank, lines, fontSize };
    }
    fontSize -= 2;
  }
  return { rank, lines: wrapWords(name, 18, maxWidth), fontSize: 18 };
}

export function honoreeScriptFontSize(nombre: string): number {
  return layoutHonoreeName(nombre).fontSize;
}
