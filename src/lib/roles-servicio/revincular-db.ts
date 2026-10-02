import type { PrismaClient } from "@src/generated/prisma";
import { vincularPersonaRol } from "@src/lib/roles-servicio/vincular";

/** Re-vincula asignaciones del mes más reciente con censo y autoridades activas. */
export async function revincularRolesServicioMesDb(
  prisma: PrismaClient,
): Promise<{ actualizadas: number }> {
  const reciente = await prisma.planRolServicio.findFirst({
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
    select: { anio: true, mes: true },
  });
  if (!reciente) return { actualizadas: 0 };

  const [aspirantes, autoridades, asignaciones] = await Promise.all([
    prisma.aspirante.findMany({
      where: { deletedAt: null },
      select: { id: true, nombres: true, apellidos: true },
    }),
    prisma.autoridad.findMany({
      where: { activa: true },
      select: { id: true, nombres: true, apellidos: true },
    }),
    prisma.asignacionRolServicio.findMany({
      where: { plan: { anio: reciente.anio, mes: reciente.mes } },
      select: { id: true, nombre: true, grado: true },
    }),
  ]);

  let actualizadas = 0;
  for (const asignacion of asignaciones) {
    const vinculo = vincularPersonaRol(asignacion.nombre, asignacion.grado, aspirantes, autoridades);
    await prisma.asignacionRolServicio.update({
      where: { id: asignacion.id },
      data: { aspiranteId: vinculo.aspiranteId, autoridadId: vinculo.autoridadId },
    });
    actualizadas += 1;
  }
  return { actualizadas };
}
