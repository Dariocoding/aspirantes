import { prisma } from "@src/lib/prisma";
import {
  FORMATO_PERMISO_ID,
  normalizeFormatoPermiso,
  type FormatoPermisoPlantilla,
} from "@src/lib/pdf/formato-permiso";

export async function loadFormatoPermisoPlantilla(): Promise<FormatoPermisoPlantilla> {
  const row = await prisma.formatoPermiso.findUnique({ where: { id: FORMATO_PERMISO_ID } });
  if (!row) return normalizeFormatoPermiso(null);
  return normalizeFormatoPermiso(row);
}
