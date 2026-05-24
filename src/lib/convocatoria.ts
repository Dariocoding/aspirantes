import { prisma } from "@/lib/prisma";

export async function getConvocatoriaActiva() {
  return prisma.convocatoria.findFirst({ where: { activa: true } });
}
