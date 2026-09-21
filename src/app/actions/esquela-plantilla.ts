"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { Prisma } from "@src/generated/prisma";
import type { EsquelaPlantillaActionState } from "@src/lib/action-types";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { requireSession } from "@src/lib/auth/guards";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { DEFAULT_ESQUELA_PLANTILLA_LAYOUT, parseEsquelaPlantillaLayout } from "@src/lib/pdf/esquela-plantilla-layout";
import { getOrCreateCumpleanosPlantilla } from "@src/lib/pdf/esquela-plantilla";
import { prisma } from "@src/lib/prisma";
import {
  EsquelaPlantillaAssetError,
  parseEsquelaPlantillaFile,
  removeEsquelaPlantillaAsset,
  uploadEsquelaPlantillaAsset,
} from "@src/lib/storage/esquela-plantilla";
import { esquelaPlantillaSaveSchema } from "@src/lib/validators/esquela-plantilla";
import { zodFieldErrors } from "@src/lib/zod-errors";
import { ZodError } from "zod";

async function requireEsquelasWrite() {
  const session = await requireSession();
  if (!hasPermission(authContextFromSession(session), Permission.ESQUELAS_WRITE)) forbidden();
}

function revalidatePlantilla() {
  revalidatePath(routes.personal.esquelas);
  revalidatePath(routes.personal.esquelasPlantilla);
}

export async function saveEsquelaPlantilla(
  _prev: EsquelaPlantillaActionState,
  formData: FormData,
): Promise<EsquelaPlantillaActionState> {
  await requireEsquelasWrite();

  try {
    const parsed = esquelaPlantillaSaveSchema.parse({
      layoutJson: formData.get("layoutJson") || "",
      quitarFondo: formData.get("quitarFondo") || "",
      quitarOverlay: formData.get("quitarOverlay") || "",
    });

    let layoutUnknown: unknown;
    try {
      layoutUnknown = JSON.parse(parsed.layoutJson) as unknown;
    } catch {
      return { ok: false, errors: { layoutJson: "El diseño no es válido." } };
    }
    const layout = parseEsquelaPlantillaLayout(layoutUnknown);

    const row = await getOrCreateCumpleanosPlantilla();
    let fondoKey = row.fondoKey;
    let overlayKey = row.overlayKey;

    const fondoFile = parseEsquelaPlantillaFile(formData, "fondo");
    const overlayFile = parseEsquelaPlantillaFile(formData, "overlay");

    if (fondoFile) {
      const next = await uploadEsquelaPlantillaAsset(fondoFile, "fondo");
      if (fondoKey && fondoKey !== next) await removeEsquelaPlantillaAsset(fondoKey);
      fondoKey = next;
    } else if (parsed.quitarFondo) {
      await removeEsquelaPlantillaAsset(fondoKey);
      fondoKey = null;
    }

    if (overlayFile) {
      const next = await uploadEsquelaPlantillaAsset(overlayFile, "overlay");
      if (overlayKey && overlayKey !== next) await removeEsquelaPlantillaAsset(overlayKey);
      overlayKey = next;
    } else if (parsed.quitarOverlay) {
      await removeEsquelaPlantillaAsset(overlayKey);
      overlayKey = null;
    }

    await prisma.esquelaPlantilla.update({
      where: { id: row.id },
      data: {
        fondoKey,
        overlayKey,
        layout: layout as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePlantilla();
    return { ok: true, errors: {}, savedAt: Date.now() };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, errors: zodFieldErrors(e) };
    if (e instanceof EsquelaPlantillaAssetError) {
      return { ok: false, errors: { _form: e.message } };
    }
    return { ok: false, errors: { _form: "No se pudo guardar la plantilla." } };
  }
}

export async function resetEsquelaPlantillaLayout(): Promise<EsquelaPlantillaActionState> {
  await requireEsquelasWrite();
  try {
    const row = await getOrCreateCumpleanosPlantilla();
    await prisma.esquelaPlantilla.update({
      where: { id: row.id },
      data: {
        layout: DEFAULT_ESQUELA_PLANTILLA_LAYOUT as unknown as Prisma.InputJsonValue,
      },
    });
    revalidatePlantilla();
    return { ok: true, errors: {}, savedAt: Date.now() };
  } catch {
    return { ok: false, errors: { _form: "No se pudo restablecer el diseño." } };
  }
}
