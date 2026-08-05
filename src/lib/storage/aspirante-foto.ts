import { deleteObject, putObject } from "@src/lib/storage/s3";

const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type AspiranteFotoKind = "perfil" | "cedula" | "titulo";

const KIND_FILE: Record<AspiranteFotoKind, string> = {
  perfil: "foto",
  cedula: "cedula",
  titulo: "titulo",
};

/** Campos FormData por tipo de imagen. */
export const ASPIRANTE_FOTO_FORM: Record<
  AspiranteFotoKind,
  { file: string; quitar: string; dbField: "fotoKey" | "fotoCedulaKey" | "fotoTituloKey" }
> = {
  perfil: { file: "imagen", quitar: "quitarImagen", dbField: "fotoKey" },
  cedula: { file: "imagenCedula", quitar: "quitarImagenCedula", dbField: "fotoCedulaKey" },
  titulo: { file: "imagenTitulo", quitar: "quitarImagenTitulo", dbField: "fotoTituloKey" },
};

export function aspiranteFotoObjectKey(aspiranteId: string, kind: AspiranteFotoKind, ext: string): string {
  return `aspirantes/${aspiranteId}/${KIND_FILE[kind]}.${ext}`;
}

/** @deprecated Prefer `aspiranteFotoObjectKey(id, "perfil", ext)`. */
export function aspiranteFotoKey(aspiranteId: string, ext: string): string {
  return aspiranteFotoObjectKey(aspiranteId, "perfil", ext);
}

export function parseAspiranteFotoFile(
  formData: FormData,
  kind: AspiranteFotoKind = "perfil",
): File | null {
  const raw = formData.get(ASPIRANTE_FOTO_FORM[kind].file);
  if (!(raw instanceof File) || raw.size === 0) return null;
  return raw;
}

export function shouldRemoveAspiranteFoto(
  formData: FormData,
  kind: AspiranteFotoKind = "perfil",
): boolean {
  return formData.get(ASPIRANTE_FOTO_FORM[kind].quitar) === "1";
}

export async function uploadAspiranteFoto(
  file: File,
  aspiranteId: string,
  kind: AspiranteFotoKind = "perfil",
): Promise<string> {
  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) {
    throw new AspiranteFotoError("Formato no permitido. Use JPEG, PNG, WebP o GIF.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = aspiranteFotoObjectKey(aspiranteId, kind, ext);
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
