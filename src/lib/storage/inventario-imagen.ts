import { deleteObject, putObject } from "@src/lib/storage/s3";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function inventarioImagenKey(area: string, itemId: string, ext: string): string {
  const areaSlug = area.toLowerCase();
  return `inventario/${areaSlug}/${itemId}/foto.${ext}`;
}

export function parseInventarioImagenFile(formData: FormData): File | null {
  const raw = formData.get("imagen");
  if (!(raw instanceof File) || raw.size === 0) return null;
  return raw;
}

export function shouldRemoveInventarioImagen(formData: FormData): boolean {
  return formData.get("quitarImagen") === "1";
}

export async function uploadInventarioImagen(
  file: File,
  area: string,
  itemId: string,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new InventarioImagenError("La imagen no puede superar 5 MB.");
  }

  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) {
    throw new InventarioImagenError("Formato no permitido. Use JPEG, PNG, WebP o GIF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = inventarioImagenKey(area, itemId, ext);
  await putObject(key, buffer, file.type);
  return key;
}

export async function removeInventarioImagen(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch {
    // Si el objeto ya no existe en el bucket, no bloqueamos la operación en BD.
  }
}

export class InventarioImagenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventarioImagenError";
  }
}
