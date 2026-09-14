import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(process.cwd(), "public", "pdfjs");
mkdirSync(destDir, { recursive: true });
copyFileSync(src, join(destDir, "pdf.worker.min.mjs"));
console.log("Copied PDF.js worker to public/pdfjs/");
