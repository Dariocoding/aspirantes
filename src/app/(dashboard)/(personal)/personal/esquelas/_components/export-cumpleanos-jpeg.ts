import { CUMPLEANOS_PAGE_W, layoutHonoreeName } from "@src/lib/pdf/esquela-cumpleanos-layout";
import {
  DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
  layoutNameMaxWidthPt,
  type EsquelaPlantillaLayout,
} from "@src/lib/pdf/esquela-plantilla-layout";

/** Plantilla nativa 864×1152; se exporta a 3× para WhatsApp / impresión. */
const NATIVE_W = 864;
const NATIVE_H = 1152;
const SCALE = 3;
const CANVAS_W = NATIVE_W * SCALE;
const CANVAS_H = NATIVE_H * SCALE;

async function loadBitmap(src: string): Promise<ImageBitmap> {
  const res = await fetch(src, { credentials: "same-origin" });
  if (!res.ok) throw new Error("No se pudo leer una imagen de la esquela.");
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function drawFitted(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  fit: "contain" | "cover",
): void {
  const scale =
    fit === "cover" ? Math.max(boxW / img.width, boxH / img.height) : Math.min(boxW / img.width, boxH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (boxW - dw) / 2;
  const dy = y + (boxH - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, boxW, boxH);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function fauxBoldOffsets(em: number): Array<[number, number]> {
  const r = em;
  const d = em * 0.72;
  return [
    [-r, 0],
    [r, 0],
    [0, -r],
    [0, r],
    [-d, -d],
    [d, -d],
    [-d, d],
    [d, d],
  ];
}

function canvasTextAlign(align: EsquelaPlantillaLayout["nameAlign"]): CanvasTextAlign {
  if (align === "left") return "left";
  if (align === "right") return "right";
  return "center";
}

function drawExportGoldScript(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontPx: number,
  maxWidth: number,
  depth: number,
  layout: EsquelaPlantillaLayout,
): void {
  const gold = layout.gold;
  const strokeW = Math.max(2.4, fontPx * layout.nameExportStrokeEm);
  const bold = fontPx * layout.nameExportFauxBoldEm;
  const grad = ctx.createLinearGradient(x, y, x, y + fontPx);
  grad.addColorStop(0, gold.fill);
  grad.addColorStop(0.38, gold.dark);
  grad.addColorStop(1, "#8f6910");

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.miterLimit = 2;

  ctx.shadowColor = "rgba(40, 24, 6, 0.62)";
  ctx.shadowBlur = fontPx * layout.nameExportShadowBlurEm;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = fontPx * layout.nameExportShadowYEm;
  ctx.fillStyle = gold.stroke;
  ctx.fillText(text, x, y, maxWidth);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = gold.dark;
  ctx.fillText(text, x, y + depth, maxWidth);

  ctx.strokeStyle = gold.stroke;
  ctx.lineWidth = strokeW;
  ctx.strokeText(text, x, y, maxWidth);
  for (const [dx, dy] of fauxBoldOffsets(bold)) {
    ctx.strokeText(text, x + dx, y + dy, maxWidth);
  }

  ctx.fillStyle = grad;
  ctx.fillText(text, x, y, maxWidth);
  ctx.fillText(text, x + bold * 0.35, y, maxWidth);
  ctx.restore();
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("No se pudo generar la imagen."));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

export type ExportCumpleanosJpegInput = {
  nombre: string;
  fotoSrc: string | null;
  fondoSrc?: string;
  overlaySrc?: string | null;
  layout?: EsquelaPlantillaLayout;
};

export async function exportCumpleanosJpegBlob({
  nombre,
  fotoSrc,
  fondoSrc = "/images/esquelas/cumpleanos-plantilla.jpg",
  overlaySrc = "/images/esquelas/corona-laurel.png",
  layout = DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
}: ExportCumpleanosJpegInput): Promise<Blob> {
  const [plantilla, overlay, foto] = await Promise.all([
    loadBitmap(fondoSrc),
    overlaySrc ? loadBitmap(overlaySrc).catch(() => null) : Promise.resolve(null),
    fotoSrc ? loadBitmap(fotoSrc).catch(() => null) : Promise.resolve(null),
  ]);

  if (!document.getElementById("great-vibes-poster-font")) {
    const style = document.createElement("style");
    style.id = "great-vibes-poster-font";
    style.textContent =
      '@font-face{font-family:"GreatVibesPoster";src:url("/fonts/GreatVibes-Regular.ttf") format("truetype");font-weight:400;font-style:normal;}';
    document.head.appendChild(style);
  }
  await document.fonts.load("48px GreatVibesPoster");
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo generar la imagen.");

  try {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(plantilla, 0, 0, CANVAS_W, CANVAS_H);

    if (foto) {
      drawFitted(
        ctx,
        foto,
        CANVAS_W * layout.photo.leftPct,
        CANVAS_H * layout.photo.topPct,
        CANVAS_W * layout.photo.widthPct,
        CANVAS_H * layout.photo.heightPct,
        layout.photoFit,
      );
    }

    if (overlay) {
      ctx.drawImage(overlay, 0, 0, CANVAS_W, CANVAS_H);
    }

    const { lines, fontSize } = layoutHonoreeName(nombre, layoutNameMaxWidthPt(layout), {
      maxFontPt: layout.nameMaxFontPt,
      minFontPt: layout.nameMinFontPt,
    });
    const fontPx = (fontSize / CUMPLEANOS_PAGE_W) * CANVAS_W;
    const nameWidth = CANVAS_W * layout.name.widthPct;
    const nameLeft = CANVAS_W * layout.name.leftPct;
    const nameTop = CANVAS_H * layout.name.topPct;
    const textX =
      layout.nameAlign === "left"
        ? nameLeft
        : layout.nameAlign === "right"
          ? nameLeft + nameWidth
          : nameLeft + nameWidth / 2;
    const lineH = fontPx * 1.28;
    const depth = fontPx * layout.nameDepthEm;

    ctx.font =
      layout.nameStyle === "plain"
        ? `700 ${fontPx}px Urbanist, ui-sans-serif, system-ui, sans-serif`
        : `${fontPx}px GreatVibesPoster, cursive`;
    ctx.textAlign = canvasTextAlign(layout.nameAlign);
    ctx.textBaseline = "top";
    ctx.letterSpacing = `${layout.nameLetterSpacingEm}em`;

    lines.forEach((text, i) => {
      const y = nameTop + i * lineH;
      if (layout.nameStyle === "plain") {
        ctx.fillStyle = layout.nameColor;
        ctx.fillText(text, textX, y, nameWidth);
      } else {
        drawExportGoldScript(ctx, text, textX, y, fontPx, nameWidth, depth, layout);
      }
    });

    return await canvasToJpeg(canvas, 0.96);
  } finally {
    plantilla.close();
    overlay?.close();
    foto?.close();
  }
}

export async function downloadCumpleanosJpeg(
  input: ExportCumpleanosJpegInput & { fileName: string },
): Promise<void> {
  const blob = await exportCumpleanosJpegBlob(input);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
