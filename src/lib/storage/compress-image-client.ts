import {
  allowedExtsForKind,
  fileLooksPdf,
  type AspiranteArchivoExt,
  type AspiranteFotoKind,
} from "@src/lib/storage/aspirante-foto";

type EncodeMime = "image/webp" | "image/jpeg";

type Preset = {
  maxEdge: number;
  quality: number;
  prefer: EncodeMime;
};

/** Perfil más liviano; documentos más nítidos (cédula, título, autenticación, notas). */
const PRESET: Record<AspiranteFotoKind, Preset> = {
  perfil: { maxEdge: 1400, quality: 0.84, prefer: "image/webp" },
  esquela: { maxEdge: 1600, quality: 0.86, prefer: "image/webp" },
  cedula: { maxEdge: 2000, quality: 0.86, prefer: "image/webp" },
  titulo: { maxEdge: 2400, quality: 0.88, prefer: "image/jpeg" },
  tituloAuth: { maxEdge: 2400, quality: 0.88, prefer: "image/jpeg" },
  notas: { maxEdge: 2400, quality: 0.9, prefer: "image/jpeg" },
};

const MIME_EXT: Record<EncodeMime, AspiranteArchivoExt> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

function scaleToMax(width: number, height: number, maxEdge: number): { w: number; h: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { w: width, h: height };
  const ratio = maxEdge / longest;
  return { w: Math.max(1, Math.round(width * ratio)), h: Math.max(1, Math.round(height * ratio)) };
}

function extFromMime(mime: EncodeMime): AspiranteArchivoExt {
  return MIME_EXT[mime];
}

function renameWithExt(originalName: string, ext: AspiranteArchivoExt): string {
  const base = originalName.replace(/\.[^.]+$/, "").trim() || "imagen";
  return `${base}.${ext}`;
}

async function decodeBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: EncodeMime, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

function isCompressibleImage(file: File): boolean {
  if (fileLooksPdf(file)) return false;
  const t = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (t === "image/gif" || name.endsWith(".gif")) return false;
  return t.startsWith("image/") || /\.(jpe?g|png|webp|bmp|heic|heif)$/.test(name);
}

async function encodeCandidate(
  canvas: HTMLCanvasElement,
  mime: EncodeMime,
  quality: number,
  originalName: string,
): Promise<File | null> {
  const blob = await canvasToBlob(canvas, mime, quality);
  if (!blob || blob.size === 0) return null;
  const ext = extFromMime(mime);
  return new File([blob], renameWithExt(originalName, ext), {
    type: mime,
    lastModified: Date.now(),
  });
}

/**
 * Reduce peso en el navegador. Si falla o el resultado no es más liviano, devuelve el original.
 * No toca GIF. WebP solo si el tipo de documento lo admite en servidor.
 */
export async function compressAspiranteImage(file: File, kind: AspiranteFotoKind): Promise<File> {
  if (!isCompressibleImage(file) || typeof createImageBitmap !== "function") return file;

  const preset = PRESET[kind];
  const allowed = allowedExtsForKind(kind);
  const candidates: EncodeMime[] = [];
  if (preset.prefer === "image/webp" && allowed.has("webp")) candidates.push("image/webp");
  if (allowed.has("jpg")) candidates.push("image/jpeg");
  if (candidates.length === 0) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeBitmap(file);
  } catch {
    return file;
  }

  try {
    const { w, h } = scaleToMax(bitmap.width, bitmap.height, preset.maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);

    let best: File | null = null;
    for (const mime of candidates) {
      const encoded = await encodeCandidate(canvas, mime, preset.quality, file.name);
      if (!encoded) continue;
      if (!best || encoded.size < best.size) best = encoded;
    }

    if (!best) return file;
    // Conservar original si la ganancia es nula o negativa (p. ej. JPEG ya pequeño).
    if (best.size >= file.size * 0.95) return file;
    return best;
  } finally {
    bitmap.close();
  }
}

async function encodeImageAsJpegBytes(file: File, maxEdge: number, quality: number): Promise<Uint8Array> {
  const bitmap = await decodeBitmap(file);
  try {
    const { w, h } = scaleToMax(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo leer una de las imágenes.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) throw new Error("No se pudo comprimir una de las imágenes.");
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

/** Imagen o PDF (hoja por hoja). Si no hay ganancia, deja el original. */
export async function compressAspiranteUpload(file: File, kind: AspiranteFotoKind): Promise<File> {
  if (fileLooksPdf(file)) {
    const { compressAspirantePdf } = await import("@src/lib/storage/compress-pdf-client");
    return compressAspirantePdf(file, kind);
  }
  return compressAspiranteImage(file, kind);
}

/**
 * Notas: una imagen se queda imagen; varias imágenes se unen en un PDF (orden de selección).
 */
export async function prepareAspiranteUpload(files: File[], kind: AspiranteFotoKind): Promise<File> {
  const list = files.filter((f) => f.size > 0);
  if (list.length === 0) {
    throw new Error("No se seleccionó ningún archivo.");
  }
  if (kind !== "notas" || list.length === 1) {
    return compressAspiranteUpload(list[0]!, kind);
  }

  if (list.length > 40) {
    throw new Error("Use como máximo 40 imágenes para armar el PDF.");
  }

  if (list.some((f) => fileLooksPdf(f))) {
    throw new Error(
      "Para unir varias hojas elija solo imágenes (JPEG o PNG). Un PDF se sube como un solo archivo.",
    );
  }

  const preset = PRESET.notas;
  const jpegs: Uint8Array[] = [];
  for (const file of list) {
    jpegs.push(await encodeImageAsJpegBytes(file, preset.maxEdge, preset.quality));
  }
  const { pdfFromJpegPages } = await import("@src/lib/storage/compress-pdf-client");
  const base = list[0]?.name.replace(/\.[^.]+$/, "").trim() || "notas";
  return pdfFromJpegPages(jpegs, `${base}-notas`);
}

/** Sustituye el File del input para que el FormData nativo envíe la versión comprimida. */
export function assignFileToInput(input: HTMLInputElement, file: File): void {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
