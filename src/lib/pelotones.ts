import type { Prisma, PrismaClient } from "@src/generated/prisma";

export const PELOTON_CANTIDAD_MIN = 0;
export const PELOTON_CANTIDAD_MAX = 40;

export type PelotonResumen = {
  id: string;
  numero: number;
  nombre: string;
};

export function nombrePelotonPorDefecto(numero: number): string {
  return `Pelotón ${numero}`;
}

export function labelPeloton(p: Pick<PelotonResumen, "numero" | "nombre">): string {
  const nombre = p.nombre?.trim();
  return nombre || nombrePelotonPorDefecto(p.numero);
}

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Ajusta los pelotones de una convocatoria a exactamente `cantidad`.
 * Solo elimina pelotones sobrantes si no tienen aspirantes asignados.
 */
export async function syncPelotonesConvocatoria(
  tx: Db,
  convocatoriaId: string,
  cantidad: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isInteger(cantidad) || cantidad < PELOTON_CANTIDAD_MIN || cantidad > PELOTON_CANTIDAD_MAX) {
    return {
      ok: false,
      error: `La cantidad de pelotones debe estar entre ${PELOTON_CANTIDAD_MIN} y ${PELOTON_CANTIDAD_MAX}.`,
    };
  }

  const existentes = await tx.peloton.findMany({
    where: { convocatoriaId },
    orderBy: { numero: "asc" },
    select: {
      id: true,
      numero: true,
      _count: { select: { aspirantes: true } },
    },
  });

  const porNumero = new Map(existentes.map((p) => [p.numero, p]));

  for (let n = 1; n <= cantidad; n++) {
    if (!porNumero.has(n)) {
      await tx.peloton.create({
        data: {
          convocatoriaId,
          numero: n,
          nombre: nombrePelotonPorDefecto(n),
        },
      });
    }
  }

  const sobrantes = existentes.filter((p) => p.numero > cantidad);
  const bloqueados = sobrantes.filter((p) => p._count.aspirantes > 0);
  if (bloqueados.length > 0) {
    const detalle = bloqueados
      .map((p) => `${nombrePelotonPorDefecto(p.numero)} (${p._count.aspirantes} aspirante(s))`)
      .join(", ");
    return {
      ok: false,
      error: `No se puede reducir a ${cantidad} pelotón(es): hay aspirantes en ${detalle}. Reasigne esos aspirantes antes de eliminar pelotones.`,
    };
  }

  if (sobrantes.length > 0) {
    await tx.peloton.deleteMany({
      where: { id: { in: sobrantes.map((p) => p.id) } },
    });
  }

  return { ok: true };
}

export async function resolvePelotonIdForConvocatoria(
  tx: Db,
  convocatoriaId: string,
  pelotonIdRaw: string | null | undefined,
): Promise<{ ok: true; pelotonId: string | null } | { ok: false; error: string }> {
  const pelotonId = pelotonIdRaw?.trim() || null;
  if (!pelotonId) {
    return { ok: true, pelotonId: null };
  }

  const peloton = await tx.peloton.findFirst({
    where: { id: pelotonId, convocatoriaId },
    select: { id: true },
  });
  if (!peloton) {
    return {
      ok: false,
      error: "El pelotón seleccionado no pertenece a esta convocatoria.",
    };
  }
  return { ok: true, pelotonId: peloton.id };
}
