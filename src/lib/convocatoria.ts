import { prisma } from "@src/lib/prisma";

export async function getConvocatoriaActiva() {
  return prisma.convocatoria.findFirst({ where: { activa: true } });
}
