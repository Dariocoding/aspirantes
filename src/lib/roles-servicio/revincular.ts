import "server-only";

import { prisma } from "@src/lib/prisma";
import { revincularRolesServicioMesDb } from "@src/lib/roles-servicio/revincular-db";

export async function revincularRolesServicioMes(): Promise<{ actualizadas: number }> {
  return revincularRolesServicioMesDb(prisma);
}
