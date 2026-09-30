import type { Prisma } from "@src/generated/prisma";

/**
 * Localiza al aspirante aunque esté en la papelera.
 * La extensión de borrado suave no aplica su filtro si el `where` menciona `deletedAt`.
 */
export function aspiranteIdIncluyendoPapelera(id: string): Prisma.AspiranteWhereInput {
  return {
    id,
    OR: [{ deletedAt: null }, { deletedAt: { not: null } }],
  };
}
