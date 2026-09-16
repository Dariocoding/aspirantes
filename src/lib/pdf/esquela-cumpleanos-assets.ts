import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getObjectBuffer } from "@src/lib/storage/s3";
import { cutoutWithGemini } from "@src/lib/pdf/gemini-cutout";

const PLANTILLA_JPEG = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "public",
  "images",
  "esquelas",
  "cumpleanos-plantilla.jpg",
);

const LAUREL_PNG = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "public",
  "images",
  "esquelas",
  "corona-laurel.png",
);

const OVAL_W = 740;
const OVAL_H = 900;
const BG_THRESH = 44;
const PAPER_LUMA = 205;
const PAPER_CHROMA = 34;

export async function readLaurelOverlayPng(): Promise<Buffer | null> {
  if (!fs.existsSync(LAUREL_PNG)) return null;
  return fs.readFileSync(LAUREL_PNG);
}

export async function readCumpleanosPlantillaJpeg(): Promise<Buffer | null> {
  if (!fs.existsSync(PLANTILLA_JPEG)) return null;
  const raw = fs.readFileSync(PLANTILLA_JPEG);
  try {
    return await sharp(raw).rotate().jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toBuffer();
  } catch {
    return raw;
  }
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
    fadeOuterPaperWhite(data, width, height);
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

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const o = i * 4;
      if ((data[o + 3] ?? 255) === 0) continue;
      let edge = 0;
      if (marked[i - 1] || marked[i + 1] || marked[i - width] || marked[i + width]) edge = 1;
      if (edge) data[o + 3] = 70;
    }
  }

  fadeOuterPaperWhite(data, width, height);
}

/** El halo blanco del óvalo (fuera del pecho/cara) se hace transparente. */
function fadeOuterPaperWhite(data: Buffer, width: number, height: number): void {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const rx = width / 2;
  const ry = height / 2;
  const pixels = width * height;
  for (let i = 0; i < pixels; i++) {
    const x = i % width;
    const y = (i / width) | 0;
    const o = i * 4;
    const r = data[o] ?? 0;
    const g = data[o + 1] ?? 0;
    const b = data[o + 2] ?? 0;
    if (!isPaperWhite(r, g, b)) continue;
    const dist = Math.hypot((x - cx) / rx, (y - cy) / ry);
    if (dist < 0.4) continue;
    const t = Math.min(1, (dist - 0.4) / 0.38);
    const s = t * t * (3 - 2 * t);
    data[o + 3] = Math.round((data[o + 3] ?? 255) * (1 - s));
  }
}

/** Recorta el fondo (Gemini si hay clave; si no, blanco de estudio) y deja un óvalo vertical. */
export async function toHonoreeCutoutPng(buffer: Buffer): Promise<Buffer> {
  const geminiPng = await cutoutWithGemini(buffer);
  const source = geminiPng ?? buffer;

  const sized = await sharp(source)
    .rotate()
    .resize(OVAL_W, OVAL_H, { fit: "cover", position: "attention" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (!geminiPng) {
    knockOutStudioBackdrop(sized.data, sized.info.width, sized.info.height);
  } else {
    fadeOuterPaperWhite(sized.data, sized.info.width, sized.info.height);
  }

  const ovalMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OVAL_W}" height="${OVAL_H}"><ellipse cx="${OVAL_W / 2}" cy="${OVAL_H / 2}" rx="${OVAL_W / 2}" ry="${OVAL_H / 2}" fill="#fff"/></svg>`,
  );

  return sharp(sized.data, {
    raw: { width: sized.info.width, height: sized.info.height, channels: 4 },
  })
    .composite([{ input: ovalMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function loadFotoCircularForEsquelaPdf(fotoKey: string | null): Promise<Buffer | null> {
  if (!fotoKey) return null;
  try {
    const { body } = await getObjectBuffer(fotoKey);
    return await toHonoreeCutoutPng(body);
  } catch {
    return null;
  }
}
