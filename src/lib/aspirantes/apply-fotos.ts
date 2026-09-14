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
    return fotoFieldError(kind, "No puede subir una imagen nueva y quitar la actual a la vez.");
  }

  if (quitar) {
    await removeAspiranteFoto(previousKey);
    await prisma.aspirante.update({
      where: { id: aspiranteId },
      data: { [dbField]: null },
    });
    return { key: null };
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
    throw e;
  }
}

/** Aplica un solo tipo de imagen (perfil, cédula, título o autenticación). */
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
