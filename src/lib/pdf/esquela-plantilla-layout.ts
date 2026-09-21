import { CUMPLEANOS_GOLD, CUMPLEANOS_LAYOUT, CUMPLEANOS_PAGE_W } from "@src/lib/pdf/esquela-cumpleanos-layout";

export type EsquelaRectPct = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

export type EsquelaNameStyle = "goldScript" | "plain";
export type EsquelaAlign = "left" | "center" | "right";
export type EsquelaPhotoFit = "contain" | "cover";

export type EsquelaGold = {
  fill: string;
  light: string;
  dark: string;
  stroke: string;
};

export type EsquelaPlantillaLayout = {
  photo: EsquelaRectPct;
  name: EsquelaRectPct;
  overlayEnabled: boolean;
  photoFit: EsquelaPhotoFit;
  nameStyle: EsquelaNameStyle;
  nameAlign: EsquelaAlign;
  nameColor: string;
  nameMaxFontPt: number;
  nameMinFontPt: number;
  nameLetterSpacingEm: number;
  nameDepthEm: number;
  nameStrokeEm: number;
  nameExportStrokeEm: number;
  nameExportFauxBoldEm: number;
  nameExportShadowYEm: number;
  nameExportShadowBlurEm: number;
  gold: EsquelaGold;
};

export const BUNDLED_ESQUELA_FONDO_SRC = "/images/esquelas/cumpleanos-plantilla.jpg";
export const BUNDLED_ESQUELA_OVERLAY_SRC = "/images/esquelas/corona-laurel.png";

/** Recuadros equivalentes al afiche ceremonial actual. */
export const DEFAULT_ESQUELA_PLANTILLA_LAYOUT: EsquelaPlantillaLayout = {
  photo: {
    leftPct: (1 - CUMPLEANOS_LAYOUT.photoWidthPct) / 2,
    topPct: CUMPLEANOS_LAYOUT.photoCenterYPct - CUMPLEANOS_LAYOUT.photoHeightPct / 2,
    widthPct: CUMPLEANOS_LAYOUT.photoWidthPct,
    heightPct: CUMPLEANOS_LAYOUT.photoHeightPct,
  },
  name: {
    leftPct: (1 - CUMPLEANOS_LAYOUT.nameWidthPct) / 2,
    topPct: CUMPLEANOS_LAYOUT.nameTopPct,
    widthPct: CUMPLEANOS_LAYOUT.nameWidthPct,
    heightPct: 0.12,
  },
  overlayEnabled: true,
  photoFit: "contain",
  nameStyle: "goldScript",
  nameAlign: "center",
  nameColor: "#3d280c",
  nameMaxFontPt: 34,
  nameMinFontPt: 18,
  nameLetterSpacingEm: CUMPLEANOS_LAYOUT.nameLetterSpacingEm === "0em" ? 0 : 0,
  nameDepthEm: CUMPLEANOS_LAYOUT.nameDepthEm,
  nameStrokeEm: CUMPLEANOS_LAYOUT.nameStrokeEm,
  nameExportStrokeEm: CUMPLEANOS_LAYOUT.nameExportStrokeEm,
  nameExportFauxBoldEm: CUMPLEANOS_LAYOUT.nameExportFauxBoldEm,
  nameExportShadowYEm: CUMPLEANOS_LAYOUT.nameExportShadowYEm,
  nameExportShadowBlurEm: CUMPLEANOS_LAYOUT.nameExportShadowBlurEm,
  gold: {
    fill: CUMPLEANOS_GOLD.fill,
    light: CUMPLEANOS_GOLD.light,
    dark: CUMPLEANOS_GOLD.dark,
    stroke: CUMPLEANOS_GOLD.stroke,
  },
};

export function cloneEsquelaPlantillaLayout(
  layout: EsquelaPlantillaLayout = DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
): EsquelaPlantillaLayout {
  return {
    ...layout,
    photo: { ...layout.photo },
    name: { ...layout.name },
    gold: { ...layout.gold },
  };
}

export function goldGradientCss(gold: EsquelaGold): string {
  return `linear-gradient(180deg, ${gold.light} 0%, ${gold.fill} 40%, ${gold.dark} 100%)`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function hex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const t = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function clampBox(box: EsquelaRectPct): EsquelaRectPct {
  const widthPct = Math.min(1, Math.max(0.02, box.widthPct));
  const heightPct = Math.min(1, Math.max(0.02, box.heightPct));
  const leftPct = Math.min(1 - widthPct, Math.max(0, box.leftPct));
  const topPct = Math.min(1 - heightPct, Math.max(0, box.topPct));
  return { leftPct, topPct, widthPct, heightPct };
}

function parseBox(value: unknown, fallback: EsquelaRectPct): EsquelaRectPct {
  if (!isRecord(value)) return clampBox({ ...fallback });
  return clampBox({
    leftPct: num(value.leftPct, fallback.leftPct, 0, 1),
    topPct: num(value.topPct, fallback.topPct, 0, 1),
    widthPct: num(value.widthPct, fallback.widthPct, 0.02, 1),
    heightPct: num(value.heightPct, fallback.heightPct, 0.02, 1),
  });
}

export function parseEsquelaPlantillaLayout(raw: unknown): EsquelaPlantillaLayout {
  const d = DEFAULT_ESQUELA_PLANTILLA_LAYOUT;
  if (!isRecord(raw)) return cloneEsquelaPlantillaLayout();
  const goldRaw = isRecord(raw.gold) ? raw.gold : {};
  const nameStyle = raw.nameStyle === "plain" ? "plain" : "goldScript";
  const nameAlign =
    raw.nameAlign === "left" || raw.nameAlign === "right" ? raw.nameAlign : "center";
  const photoFit = raw.photoFit === "cover" ? "cover" : "contain";
  return {
    photo: parseBox(raw.photo, d.photo),
    name: parseBox(raw.name, d.name),
    overlayEnabled: raw.overlayEnabled !== false,
    photoFit,
    nameStyle,
    nameAlign,
    nameColor: hex(raw.nameColor, d.nameColor),
    nameMaxFontPt: num(raw.nameMaxFontPt, d.nameMaxFontPt, 10, 72),
    nameMinFontPt: num(raw.nameMinFontPt, d.nameMinFontPt, 8, 48),
    nameLetterSpacingEm: num(raw.nameLetterSpacingEm, d.nameLetterSpacingEm, -0.1, 0.4),
    nameDepthEm: num(raw.nameDepthEm, d.nameDepthEm, 0, 0.12),
    nameStrokeEm: num(raw.nameStrokeEm, d.nameStrokeEm, 0, 0.12),
    nameExportStrokeEm: num(raw.nameExportStrokeEm, d.nameExportStrokeEm, 0, 0.2),
    nameExportFauxBoldEm: num(raw.nameExportFauxBoldEm, d.nameExportFauxBoldEm, 0, 0.08),
    nameExportShadowYEm: num(raw.nameExportShadowYEm, d.nameExportShadowYEm, 0, 0.16),
    nameExportShadowBlurEm: num(raw.nameExportShadowBlurEm, d.nameExportShadowBlurEm, 0, 0.2),
    gold: {
      fill: hex(goldRaw.fill, d.gold.fill),
      light: hex(goldRaw.light, d.gold.light),
      dark: hex(goldRaw.dark, d.gold.dark),
      stroke: hex(goldRaw.stroke, d.gold.stroke),
    },
  };
}

export function layoutNameMaxWidthPt(layout: EsquelaPlantillaLayout): number {
  return CUMPLEANOS_PAGE_W * layout.name.widthPct;
}

export function plantillaArchivoUrl(kind: "fondo" | "overlay", version?: string | number | Date): string {
  const v = version instanceof Date ? version.getTime() : version;
  const q = v != null && String(v).length ? `&v=${encodeURIComponent(String(v))}` : "";
  return `/api/esquelas/plantilla/archivo?kind=${kind}${q}`;
}

export function pctBoxStyle(box: EsquelaRectPct): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${box.leftPct * 100}%`,
    top: `${box.topPct * 100}%`,
    width: `${box.widthPct * 100}%`,
    height: `${box.heightPct * 100}%`,
  };
}
