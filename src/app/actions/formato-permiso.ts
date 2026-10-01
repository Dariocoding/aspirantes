"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { writeAuditLog } from "@src/lib/audit/log";
import { requireWriter } from "@src/lib/auth/guards";
import type { FormatoPermisoActionState } from "@src/lib/action-types";
import { routes } from "@src/lib/apps/routes";
import { FORMATO_PERMISO_ID } from "@src/lib/pdf/formato-permiso";
import { prisma } from "@src/lib/prisma";
import { formatoPermisoSchema } from "@src/lib/validators/formato-permiso";
import { zodFieldErrors } from "@src/lib/zod-errors";

function revalidateFormato() {
  revalidatePath(routes.personal.permisos);
  revalidatePath(routes.personal.permisosFormato);
}

export async function updateFormatoPermiso(
  _prev: FormatoPermisoActionState,
  formData: FormData,
): Promise<FormatoPermisoActionState> {
  const session = await requireWriter();

  try {
    const parsed = formatoPermisoSchema.parse({
      lineasTexto: formData.get("lineasTexto") || "",
      logoIzq: formData.get("logoIzq") || "none",
      logoDer: formData.get("logoDer") || "none",
      titulo: formData.get("titulo") || "",
      compania: formData.get("compania") || "",
      firmanteNombre: formData.get("firmanteNombre") || "",
      firmanteCargo: formData.get("firmanteCargo") || "",
      nota: formData.get("nota") || "",
    });

    await prisma.formatoPermiso.upsert({
      where: { id: FORMATO_PERMISO_ID },
      create: {
        id: FORMATO_PERMISO_ID,
        lineas: parsed.lineas,
        logoIzq: parsed.logoIzq,
        logoDer: parsed.logoDer,
        titulo: parsed.titulo,
        compania: parsed.compania,
        firmanteNombre: parsed.firmanteNombre,
        firmanteCargo: parsed.firmanteCargo,
        nota: parsed.nota,
      },
      update: {
        lineas: parsed.lineas,
        logoIzq: parsed.logoIzq,
        logoDer: parsed.logoDer,
        titulo: parsed.titulo,
        compania: parsed.compania,
        firmanteNombre: parsed.firmanteNombre,
        firmanteCargo: parsed.firmanteCargo,
        nota: parsed.nota,
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "FORMATO_PERMISO_UPDATE",
      entityType: "FORMATO_PERMISO",
      entityId: FORMATO_PERMISO_ID,
    });

    revalidateFormato();
    return { ok: true, errors: {} };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, errors: zodFieldErrors(e) };
    return { ok: false, errors: { _form: "No se pudo guardar el formato." } };
  }
}
