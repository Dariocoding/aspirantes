import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getObjectBuffer } from "@src/lib/storage/s3";
import { cutoutWithGemini } from "@src/lib/pdf/gemini-cutout";

function readPublicEsquelaAsset(fileName: "cumpleanos-plantilla.jpg" | "corona-laurel.png"): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "images", "esquelas", fileName));
  } catch {
    return null;
  }
}

const OVAL_W = 740;
const OVAL_H = 900;
const BG_THRESH = 44;
const PAPER_LUMA = 205;
const PAPER_CHROMA = 34;

export async function readLaurelOverlayPng(): Promise<Buffer | null> {
  return readPublicEsquelaAsset("corona-laurel.png");
}

export async function readCumpleanosPlantillaJpeg(): Promise<Buffer | null> {
  return readPublicEsquelaAsset("cumpleanos-plantilla.jpg");
}

function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function sampleCorners(data: Buffer, width: number, height: number): { r: number; g: number; b: number } {
  const patches: Array<[number, number]> = [
    [2, 2],
    [width - 12, 2],
    [2, height - 12],
    [width - 12, height - 12],
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const [sx, sy] of patches) {
    for (let y = sy; y < sy + 10 && y < height; y++) {
      for (let x = sx; x < sx + 10 && x < width; x++) {
        const o = (y * width + x) * 4;
        r += data[o] ?? 0;
        g += data[o + 1] ?? 0;
        b += data[o + 2] ?? 0;
        n++;
      }
    }
  }
  return { r: r / n, g: g / n, b: b / n };
}

function isPaperWhite(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return luma(r, g, b) >= PAPER_LUMA && max - min <= PAPER_CHROMA;
}

function isNearBg(
  data: Buffer,
  width: number,
  x: number,
  y: number,
  bg: { r: number; g: number; b: number },
): boolean {
  const o = (y * width + x) * 4;
  const r = data[o] ?? 0;
  const g = data[o + 1] ?? 0;
  const b = data[o + 2] ?? 0;
  if (isPaperWhite(r, g, b)) return true;
  return Math.hypot(r - bg.r, g - bg.g, b - bg.b) <= BG_THRESH;
}

/**
 * Quita el fondo de estudio blanco conectado a los bordes.
 * No entra al torso (camisa blanca): el pecho queda en la columna central.
 */
export function knockOutStudioBackdrop(data: Buffer, width: number, height: number): void {
  const bg = sampleCorners(data, width, height);
  if (luma(bg.r, bg.g, bg.b) < 200) {
    return;
  }

  const marked = new Uint8Array(width * height);
  const queue: number[] = [];
  const maxUpperY = Math.floor(height * 0.64);
  const torsoHalf = Math.floor(width * 0.18);
  const cx = (width - 1) / 2;

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (marked[i]) return;
    if (!isNearBg(data, width, x, y, bg)) return;
    marked[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x++) push(x, 0);
  for (let y = 0; y <= maxUpperY; y++) {
    push(0, y);
    push(width - 1, y);
  }
  for (let x = 0; x < width; x++) {
    if (Math.abs(x - cx) >= torsoHalf) {
      push(x, height - 1);
    }
  }
  for (let y = maxUpperY + 1; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  const dirs = [1, -1, width, -width];
  for (let qi = 0; qi < queue.length; qi++) {
    const i = queue[qi] ?? 0;
    const x = i % width;
    const y = (i / width) | 0;
    const inTorsoColumn = Math.abs(x - cx) < torsoHalf && y > maxUpperY;
    if (inTorsoColumn) continue;
    for (const d of dirs) {
      if (d === 1 && x === width - 1) continue;
      if (d === -1 && x === 0) continue;
      const ni = i + d;
      if (ni < 0 || ni >= width * height) continue;
      const nx = ni % width;
      const ny = (ni / width) | 0;
      if (Math.abs(nx - cx) < torsoHalf && ny > maxUpperY) continue;
      push(nx, ny);
    }
  }

  for (let i = 0; i < marked.length; i++) {
    if (!marked[i]) continue;
    data[i * 4 + 3] = 0;
  }
}

function hasTransparentPixels(data: Buffer): boolean {
  const pixels = data.length / 4;
  const step = Math.max(1, Math.floor(pixels / 12000));
  for (let i = 0; i < pixels; i += step) {
    if ((data[i * 4 + 3] ?? 255) < 250) return true;
  }
  return false;
}

async function fitHonoreePng(buffer: Buffer, knockOutIfOpaque: boolean): Promise<Buffer> {
  const original = await sharp(buffer).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alreadyCutout = hasTransparentPixels(original.data);

  const sized = await sharp(buffer)
    .rotate()
    .ensureAlpha()
    .resize(OVAL_W, OVAL_H, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (knockOutIfOpaque && !alreadyCutout) {
    knockOutStudioBackdrop(sized.data, sized.info.width, sized.info.height);
  }

  return sharp(sized.data, {
    raw: { width: sized.info.width, height: sized.info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Encaja la foto en el hueco de la corona sin recortar ni inventar un óvalo opaco. */
export async function toHonoreeOvalPng(buffer: Buffer): Promise<Buffer> {
  return fitHonoreePng(buffer, false);
}

/** Recorta el fondo (Gemini si hay clave; si no, blanco de estudio) y conserva la silueta. */
export async function toHonoreeCutoutPng(buffer: Buffer): Promise<Buffer> {
  const geminiPng = await cutoutWithGemini(buffer);
  return fitHonoreePng(geminiPng ?? buffer, !geminiPng);
}

export type EsquelaPdfFoto = { data: Buffer; format: "jpg" | "png" };

/** JPEG/PNG tal cual; WebP/GIF a PNG solo para que react-pdf pueda incrustarlos. */
async function toPdfSafeFoto(buffer: Buffer): Promise<EsquelaPdfFoto> {
  const format = (await sharp(buffer).metadata()).format;
  if (format === "jpeg") {
    return { data: Buffer.from(buffer), format: "jpg" };
  }
  if (format === "png") {
    return { data: Buffer.from(buffer), format: "png" };
  }
  const png = await sharp(buffer).ensureAlpha().png().toBuffer();
  return { data: png, format: "png" };
}

export async function loadFotoOvalForEsquelaPdf(fotoKey: string | null): Promise<Buffer | null> {
  if (!fotoKey) return null;
  try {
    const { body } = await getObjectBuffer(fotoKey);
    return await toHonoreeOvalPng(body);
  } catch {
    return null;
  }
}

/** Foto ceremonial: sin óvalo, recorte ni reescalado. La de carnet sí se encaja. */
export async function loadFotoForCumpleanosPdf(
  fotoKey: string | null,
  kind: "esquela" | "perfil" | undefined,
): Promise<EsquelaPdfFoto | null> {
  if (!fotoKey) return null;
  try {
    const { body } = await getObjectBuffer(fotoKey);
    if (kind === "esquela") return await toPdfSafeFoto(body);
    const png = await toHonoreeOvalPng(body);
    return { data: png, format: "png" };
  } catch {
    return null;
  }
}

export async function loadFotoCircularForEsquelaPdf(fotoKey: string | null): Promise<Buffer | null> {
  return loadFotoOvalForEsquelaPdf(fotoKey);
}
