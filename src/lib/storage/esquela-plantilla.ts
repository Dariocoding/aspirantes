import { deleteObject, getObjectBuffer, putObject } from "@src/lib/storage/s3";

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export type EsquelaPlantillaAssetKind = "fondo" | "overlay";

export function esquelaPlantillaAssetKey(kind: EsquelaPlantillaAssetKind, ext: string): string {
  return `esquelas/plantilla/cumpleanos/${kind}.${ext}`;
}

export function parseEsquelaPlantillaFile(formData: FormData, field: string): File | null {
  const raw = formData.get(field);
  if (!(raw instanceof File) || raw.size === 0) return null;
  return raw;
}

export async function uploadEsquelaPlantillaAsset(
  file: File,
  kind: EsquelaPlantillaAssetKind,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new EsquelaPlantillaAssetError("La imagen no puede superar 12 MB.");
  }
  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) {
    throw new EsquelaPlantillaAssetError("Formato no permitido. Use JPEG, PNG o WebP.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = esquelaPlantillaAssetKey(kind, ext);
  await putObject(key, buffer, file.type);
  return key;
}

export async function removeEsquelaPlantillaAsset(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await deleteObject(key);
  } catch {
    // El objeto puede no existir ya.
  }
}

export async function readEsquelaPlantillaAssetBuffer(
  key: string,
): Promise<{ body: Buffer; contentType?: string }> {
  return getObjectBuffer(key);
}

export class EsquelaPlantillaAssetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EsquelaPlantillaAssetError";
  }
}
