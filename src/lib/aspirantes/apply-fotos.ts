import type { AspiranteActionState } from "@src/lib/action-types";
import { prisma } from "@src/lib/prisma";
import {
  ASPIRANTE_FOTO_FORM,
  AspiranteFotoError,
  type AspiranteFotoKind,
  parseAspiranteFotoFile,
  removeAspiranteFoto,
  shouldRemoveAspiranteFoto,
  uploadAspiranteFoto,
} from "@src/lib/storage/aspirante-foto";

function fotoFieldError(kind: AspiranteFotoKind, message: string): AspiranteActionState {
  const key =
    kind === "perfil" ? "imagen" : kind === "cedula" ? "imagenCedula" : "imagenTitulo";
  return { ok: false, errors: { [key]: message } };
}

export type AspiranteFotoKeys = {
  fotoKey: string | null;
  fotoCedulaKey: string | null;
  fotoTituloKey: string | null;
};

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

/** Aplica perfil, cédula y título desde el FormData. */
export async function applyAspiranteFotosFromForm(
  formData: FormData,
  aspiranteId: string,
  previous: AspiranteFotoKeys,
): Promise<AspiranteActionState | AspiranteFotoKeys> {
  const kinds: AspiranteFotoKind[] = ["perfil", "cedula", "titulo"];
  const next: AspiranteFotoKeys = { ...previous };

  for (const kind of kinds) {
    const prevKey =
      kind === "perfil"
        ? previous.fotoKey
        : kind === "cedula"
          ? previous.fotoCedulaKey
          : previous.fotoTituloKey;
    const result = await applyOneFoto(formData, aspiranteId, kind, prevKey);
    if ("ok" in result && result.ok === false) {
      return result;
    }
    if ("key" in result) {
      if (kind === "perfil") next.fotoKey = result.key;
      else if (kind === "cedula") next.fotoCedulaKey = result.key;
      else next.fotoTituloKey = result.key;
    }
  }

  return next;
}

export async function removeAllAspiranteFotos(keys: AspiranteFotoKeys): Promise<void> {
  await Promise.all([
    removeAspiranteFoto(keys.fotoKey),
    removeAspiranteFoto(keys.fotoCedulaKey),
    removeAspiranteFoto(keys.fotoTituloKey),
  ]);
}
