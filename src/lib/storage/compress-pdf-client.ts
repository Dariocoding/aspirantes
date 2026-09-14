import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { AspiranteFotoKind } from "@src/lib/storage/aspirante-foto";

const MAX_PAGES = 40;
const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.78;

function ensureWorker(): void {
  if (typeof window === "undefined") return;
  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  }
}

function scaleToMax(width: number, height: number, maxEdge: number): number {
  const longest = Math.max(width, height);
  if (longest <= 0) return 1;
  if (longest <= maxEdge) {
    // Escaneos enormes en puntos PDF: subir un poco si la hoja es pequeña en CSS px.
    return longest < 900 ? Math.min(2, maxEdge / longest) : 1;
  }
  return maxEdge / longest;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir una hoja del PDF."));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Rasteriza cada hoja, la comprime a JPEG y arma un PDF nuevo.
 * Si falla o no adelgaza, devuelve el original.
 */
export async function compressAspirantePdf(file: File, _kind: AspiranteFotoKind): Promise<File> {
  if (typeof window === "undefined") return file;
  ensureWorker();

  const data = new Uint8Array(await file.arrayBuffer());
  let pdf;
  try {
    pdf = await getDocument({ data: data.slice(), disableRange: true, disableStream: true }).promise;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/password/i.test(msg)) {
      throw new Error("Este PDF está protegido con contraseña. Guárdelo sin clave o suba JPEG/PNG.");
    }
    return file;
  }

  try {
    if (pdf.numPages < 1) return file;
    if (pdf.numPages > MAX_PAGES) {
      throw new Error(`El PDF tiene ${pdf.numPages} hojas. Use como máximo ${MAX_PAGES} o suba JPEG/PNG.`);
    }

    const out = await PDFDocument.create();
    out.setTitle(file.name.replace(/\.[^.]+$/, "") || "notas");

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = scaleToMax(base.width, base.height, MAX_EDGE);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return file;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      page.cleanup();

      const jpeg = await canvasToJpeg(canvas, JPEG_QUALITY);
      canvas.width = 0;
      canvas.height = 0;

      const image = await out.embedJpg(jpeg);
      const pdfPage = out.addPage([image.width, image.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const bytes = await out.save({ useObjectStreams: true });
    if (bytes.byteLength >= file.size * 0.95) return file;

    const base = file.name.replace(/\.[^.]+$/, "").trim() || "notas";
    return new File([toArrayBuffer(bytes)], `${base}.pdf`, {
      type: "application/pdf",
      lastModified: Date.now(),
    });
  } finally {
    await pdf.destroy();
  }
}
