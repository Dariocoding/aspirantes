import { deleteObject, putObject } from "@src/lib/storage/s3";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function aspiranteFotoKey(aspiranteId: string, ext: string): string {
  return `aspirantes/${aspiranteId}/foto.${ext}`;
}

export function parseAspiranteFotoFile(formData: FormData): File | null {
  const raw = formData.get("imagen");
  if (!(raw instanceof File) || raw.size === 0) return null;
  return raw;
}

export function shouldRemoveAspiranteFoto(formData: FormData): boolean {
  return formData.get("quitarImagen") === "1";
}

export async function uploadAspiranteFoto(file: File, aspiranteId: string): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new AspiranteFotoError("La imagen no puede superar 5 MB.");
  }

  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) {
    throw new AspiranteFotoError("Formato no permitido. Use JPEG, PNG, WebP o GIF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = aspiranteFotoKey(aspiranteId, ext);
  await putObject(key, buffer, file.type);
  return key;
}

export async function removeAspiranteFoto(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch {
    // Si el objeto ya no existe en el bucket, no bloqueamos la operación en BD.
  }
}

export class AspiranteFotoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AspiranteFotoError";
  }
}
