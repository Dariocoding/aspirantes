import {
  CUMPLEANOS_GOLD,
  CUMPLEANOS_LAYOUT,
  CUMPLEANOS_PAGE_W,
  layoutHonoreeName,
} from "@src/lib/pdf/esquela-cumpleanos-layout";

/** Plantilla nativa 864×1152; se exporta a 3× para WhatsApp / impresión. */
const NATIVE_W = 864;
const NATIVE_H = 1152;
const SCALE = 3;
const CANVAS_W = NATIVE_W * SCALE;
const CANVAS_H = NATIVE_H * SCALE;

const PLANTILLA_SRC = "/images/esquelas/cumpleanos-plantilla.jpg";
const LAUREL_SRC = "/images/esquelas/corona-laurel.png";

async function loadBitmap(src: string): Promise<ImageBitmap> {
  const res = await fetch(src, { credentials: "same-origin" });
  if (!res.ok) throw new Error("No se pudo leer una imagen de la esquela.");
  const blob = await res.blob();
  return createImageBitmap(blob);
}

function drawContained(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
): void {
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (boxW - dw) / 2, y + (boxH - dh) / 2, dw, dh);
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

export async function exportCumpleanosJpegBlob(nombre: string, fotoSrc: string | null): Promise<Blob> {
  const [plantilla, laurel, foto] = await Promise.all([
    loadBitmap(PLANTILLA_SRC),
    loadBitmap(LAUREL_SRC),
    fotoSrc ? loadBitmap(fotoSrc).catch(() => null) : Promise.resolve(null),
  ]);

  await document.fonts.load(`48px SatisfyPoster`);
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
      const photoW = CANVAS_W * CUMPLEANOS_LAYOUT.photoWidthPct;
      const photoH = CANVAS_H * CUMPLEANOS_LAYOUT.photoHeightPct;
      const photoLeft = (CANVAS_W - photoW) / 2;
      const photoTop = CANVAS_H * CUMPLEANOS_LAYOUT.photoCenterYPct - photoH / 2;
      drawContained(ctx, foto, photoLeft, photoTop, photoW, photoH);
    }

    ctx.drawImage(laurel, 0, 0, CANVAS_W, CANVAS_H);

    const { rank, lines, fontSize } = layoutHonoreeName(nombre);
    const fontPx = (fontSize / CUMPLEANOS_PAGE_W) * CANVAS_W;
    const nameWidth = CANVAS_W * CUMPLEANOS_LAYOUT.nameWidthPct;
    const nameLeft = (CANVAS_W - nameWidth) / 2;
    const nameTop = CANVAS_H * CUMPLEANOS_LAYOUT.nameTopPct;
    const cx = nameLeft + nameWidth / 2;
    const lineH = fontPx * 1.18;
    const allLines = [rank, ...lines];

    ctx.font = `${fontPx}px SatisfyPoster, cursive`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.letterSpacing = CUMPLEANOS_LAYOUT.nameLetterSpacingEm;

    allLines.forEach((text, i) => {
      const y = nameTop + i * lineH;
      const grad = ctx.createLinearGradient(cx, y, cx, y + fontPx);
      grad.addColorStop(0, CUMPLEANOS_GOLD.light);
      grad.addColorStop(0.42, CUMPLEANOS_GOLD.fill);
      grad.addColorStop(1, CUMPLEANOS_GOLD.dark);
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = Math.max(1, fontPx * 0.028);
      ctx.strokeStyle = CUMPLEANOS_GOLD.stroke;
      ctx.strokeText(text, cx, y, nameWidth);
      ctx.fillStyle = grad;
      ctx.fillText(text, cx, y, nameWidth);
    });

    return await canvasToJpeg(canvas, 0.93);
  } finally {
    plantilla.close();
    laurel.close();
    foto?.close();
  }
}

export async function downloadCumpleanosJpeg(
  nombre: string,
  fotoSrc: string | null,
  fileName: string,
): Promise<void> {
  const blob = await exportCumpleanosJpegBlob(nombre, fotoSrc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
