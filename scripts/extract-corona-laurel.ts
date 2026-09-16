import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const plantilla = path.join(process.cwd(), "public/images/esquelas/cumpleanos-plantilla.jpg");
const out = path.join(process.cwd(), "public/images/esquelas/corona-laurel.png");

function hueDeg(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d < 1e-6) return 0;
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

async function main() {
  const { data, info } = await sharp(plantilla).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const y0 = Math.floor(height * 0.3);
  const y1 = Math.floor(height * 0.66);
  const x0 = Math.floor(width * 0.16);
  const x1 = Math.floor(width * 0.84);
  const mask = new Uint8Array(width * height);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const o = (y * width + x) * 4;
      const r = data[o] ?? 0;
      const g = data[o + 1] ?? 0;
      const b = data[o + 2] ?? 0;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const s = max === 0 ? 0 : (max - min) / max;
      const v = max / 255;
      const h = hueDeg(r, g, b);
      if (h >= 28 && h <= 56 && s >= 0.32 && v >= 0.32 && r > b + 20 && g > b) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Dilate 1px so leaf edges stay connected
  const dil = new Uint8Array(mask);
  for (let y = y0 + 1; y < y1 - 1; y++) {
    for (let x = x0 + 1; x < x1 - 1; x++) {
      const i = y * width + x;
      if (mask[i - 1] || mask[i + 1] || mask[i - width] || mask[i + width]) dil[i] = 1;
    }
  }

  for (let i = 0; i < width * height; i++) {
    if (!dil[i]) {
      data[i * 4 + 3] = 0;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(out);
  console.log("wrote", out);
}

void main();
