/**
 * Rasteriza ficha-generada.pdf con mupdf y compara con referencia-form.png.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import * as mupdf from "mupdf";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const pixelmatchMod = require("pixelmatch");
const pixelmatch = typeof pixelmatchMod === "function" ? pixelmatchMod : pixelmatchMod.default;

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "tmp-ficha-compare");
const REF = path.join(ROOT, "referencia-form.png");
const PDF = path.join(OUT_DIR, "ficha-generada.pdf");
const GEN = path.join(OUT_DIR, "ficha-generada.png");

const pdfBuffer = fs.readFileSync(PDF);
const doc = mupdf.Document.openDocument(pdfBuffer, "application/pdf");
const page = doc.loadPage(0);
const bounds = page.getBounds();
const pageW = bounds[2] - bounds[0];
const scale = 649 / pageW;
const pixmap = page.toPixmap(
  mupdf.Matrix.scale(scale, scale),
  mupdf.ColorSpace.DeviceRGB,
  false,
  true,
);
const png = Buffer.from(pixmap.asPNG());
fs.writeFileSync(GEN, png);
console.log("Raster:", pixmap.getWidth(), "x", pixmap.getHeight());

const refMeta = await sharp(REF).metadata();
const targetW = refMeta.width;
const targetH = refMeta.height;

const refRaw = await sharp(REF).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const genRaw = await sharp(GEN)
  .resize(targetW, targetH, { fit: "fill" })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const diff = Buffer.alloc(targetW * targetH * 4);
const mismatched = pixelmatch(refRaw.data, genRaw.data, diff, targetW, targetH, {
  threshold: 0.12,
  includeAA: true,
});

const diffPath = path.join(OUT_DIR, "diff.png");
await sharp(diff, { raw: { width: targetW, height: targetH, channels: 4 } }).png().toFile(diffPath);

const total = targetW * targetH;
const pct = ((mismatched / total) * 100).toFixed(2);
console.log(`Diff: ${mismatched}/${total} px (${pct}%)`);
console.log("Diff PNG:", diffPath);

await sharp({
  create: {
    width: targetW * 2 + 8,
    height: targetH,
    channels: 3,
    background: { r: 40, g: 40, b: 40 },
  },
})
  .composite([
    { input: await sharp(REF).png().toBuffer(), left: 0, top: 0 },
    {
      input: await sharp(GEN).resize(targetW, targetH, { fit: "fill" }).png().toBuffer(),
      left: targetW + 8,
      top: 0,
    },
  ])
  .png()
  .toFile(path.join(OUT_DIR, "side-by-side.png"));

console.log("Side-by-side:", path.join(OUT_DIR, "side-by-side.png"));
