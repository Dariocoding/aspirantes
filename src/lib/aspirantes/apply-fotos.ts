import type { AspiranteActionState } from "@src/lib/action-types";
import { prisma } from "@src/lib/prisma";
import {
  ASPIRANTE_FOTO_FORM,
  ASPIRANTE_FOTO_KINDS,
  AspiranteFotoError,
  type AspiranteFotoDbField,
  type AspiranteFotoKind,
  parseAspiranteFotoFile,
  removeAspiranteFoto,
  shouldRemoveAspiranteFoto,
  uploadAspiranteFoto,
} from "@src/lib/storage/aspirante-foto";

function fotoFieldError(kind: AspiranteFotoKind, message: string): AspiranteActionState {
  return { ok: false, errors: { [ASPIRANTE_FOTO_FORM[kind].file]: message } };
}

export function unknownFotoSaveError(e: unknown): string {
  const code =
    e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "";
  const msg = e instanceof Error ? e.message : String(e);
  if (
    code === "P2022" ||
    /fotoNotasKey|column .* does not exist|The column/i.test(msg)
  ) {
    return "La base de datos no está al día. Reinicie el contenedor para aplicar las migraciones (prisma migrate deploy).";
  }
  if (/Body exceeded|body exceeded|too large|unexpected response/i.test(msg)) {
    return "El archivo es demasiado grande para el servidor. Comprima el PDF o use un JPEG/PNG más liviano.";
  }
  if (/ECONNRESET|ETIMEDOUT|AccessDenied|NoSuchBucket|credentials|S3|fetch failed/i.test(msg)) {
    return "No se pudo guardar el archivo en el almacenamiento. Intente de nuevo.";
  }
  return "No se pudo guardar el documento. Si el archivo es JPEG o PNG válido, intente de nuevo.";
}

export type AspiranteFotoKeys = Record<AspiranteFotoDbField, string | null>;

async function applyOneFoto(
  formData: FormData,
  aspiranteId: string,
  kind: AspiranteFotoKind,
  previousKey: string | null,
): Promise<AspiranteActionState | { key: string | null }> {
  const file = parseAspiranteFotoFile(formData, kind);
  const quitar = shouldRemoveAspiranteFoto(formData, kind);
  const dbField = ASPIRANTE_FOTO_FORM[kind].dbField;

  if (file && quitar) {
    return fotoFieldError(kind, "No puede subir un archivo nuevo y quitar el actual a la vez.");
  }

  if (quitar) {
    try {
      await removeAspiranteFoto(previousKey);
      await prisma.aspirante.update({
        where: { id: aspiranteId },
        data: { [dbField]: null },
      });
      return { key: null };
    } catch (e) {
      console.error("[aspirante-foto] quitar", kind, e);
      return fotoFieldError(kind, unknownFotoSaveError(e));
    }
  }

  if (!file) {
    return { key: previousKey };
  }

  try {
    const newKey = await uploadAspiranteFoto(file, aspiranteId, kind);
    await prisma.aspirante.update({
      where: { id: aspiranteId },
      data: { [dbField]: newKey },
    });
    if (previousKey && previousKey !== newKey) {
      await removeAspiranteFoto(previousKey);
    }
    return { key: newKey };
  } catch (e) {
    if (e instanceof AspiranteFotoError) {
      return fotoFieldError(kind, e.message);
    }
    console.error("[aspirante-foto] subir", kind, e);
    return fotoFieldError(kind, unknownFotoSaveError(e));
  }
}

/** Aplica un solo tipo de archivo (perfil, cédula, título, autenticación o notas). */
export async function applyAspiranteFotoKind(
  formData: FormData,
  aspiranteId: string,
  kind: AspiranteFotoKind,
  previousKey: string | null,
): Promise<AspiranteActionState | { key: string | null }> {
  return applyOneFoto(formData, aspiranteId, kind, previousKey);
}
export async function applyAspiranteFotosFromForm(
  formData: FormData,
  aspiranteId: string,
  previous: AspiranteFotoKeys,
): Promise<AspiranteActionState | AspiranteFotoKeys> {
  const next: AspiranteFotoKeys = { ...previous };

  for (const kind of ASPIRANTE_FOTO_KINDS) {
    const dbField = ASPIRANTE_FOTO_FORM[kind].dbField;
    const result = await applyOneFoto(formData, aspiranteId, kind, previous[dbField]);
    if ("ok" in result && result.ok === false) {
      return result;
    }
    if ("key" in result) {
      next[dbField] = result.key;
    }
  }

  return next;
}

export async function removeAllAspiranteFotos(keys: AspiranteFotoKeys): Promise<void> {
  await Promise.all(Object.values(keys).map((key) => removeAspiranteFoto(key)));
}
