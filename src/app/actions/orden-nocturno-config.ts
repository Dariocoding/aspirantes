"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import {
  normalizeOrdenNocturnoConfig,
  type OrdenNocturnoConfig,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import { saveOrdenNocturnoConfig } from "@src/lib/roles-servicio/orden-del-dia/load-config-nocturno";

export type SaveOrdenNocturnoResult =
  | { ok: true; config: OrdenNocturnoConfig }
  | { ok: false; message: string };

export async function updateOrdenNocturnoConfig(
  raw: OrdenNocturnoConfig,
): Promise<SaveOrdenNocturnoResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para guardar la configuración." };
  }

  try {
    const config = await saveOrdenNocturnoConfig(normalizeOrdenNocturnoConfig(raw));
    revalidatePath(routes.personal.rolesServicio);
    return { ok: true, config };
  } catch (e) {
    console.error("[orden-nocturno-config]", e);
    return { ok: false, message: "No se pudo guardar la configuración." };
  }
}
