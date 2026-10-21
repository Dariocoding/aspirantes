"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@src/lib/apps/routes";
import { requireWriter } from "@src/lib/auth/guards";
import { prisma } from "@src/lib/prisma";

export type DuplicarRolesResult =
  | { ok: true; copiados: number; omitidos: number }
  | { ok: false; message: string };

function mesValido(anio: number, mes: number): boolean {
  return anio >= 2000 && anio <= 2100 && mes >= 1 && mes <= 12;
}

/** Copia los roles y el personal de un mes a otro. Los días de guardia no se copian. */
export async function duplicarRolesDeMes(input: {
  origenAnio: number;
  origenMes: number;
  destinoAnio: number;
  destinoMes: number;
}): Promise<DuplicarRolesResult> {
  await requireWriter();

  const origenAnio = Math.floor(input.origenAnio);
  const origenMes = Math.floor(input.origenMes);
  const destinoAnio = Math.floor(input.destinoAnio);
  const destinoMes = Math.floor(input.destinoMes);
  if (!mesValido(origenAnio, origenMes) || !mesValido(destinoAnio, destinoMes)) {
    return { ok: false, message: "Elige un mes válido." };
  }
  if (origenAnio === destinoAnio && origenMes === destinoMes) {
    return { ok: false, message: "Elige un mes distinto al de origen." };
  }

  const destinoSellado = await prisma.planRolServicio.findFirst({
    where: { anio: destinoAnio, mes: destinoMes, sellado: true },
    select: { id: true },
  });
  if (destinoSellado) {
    return { ok: false, message: "El mes de destino está sellado. Sus roles no se modifican." };
  }

  const origen = await prisma.planRolServicio.findMany({
    where: { anio: origenAnio, mes: origenMes },
    include: { asignaciones: { orderBy: { orden: "asc" } } },
  });
  if (origen.length === 0) {
    return { ok: false, message: "Ese mes no tiene roles para copiar." };
  }

  const yaEstan = await prisma.planRolServicio.findMany({
    where: { anio: destinoAnio, mes: destinoMes },
    select: { rolServicioId: true },
  });
  const existentes = new Set(yaEstan.map((plan) => plan.rolServicioId));

  let copiados = 0;
  let omitidos = 0;

  await prisma.$transaction(async (tx) => {
    for (const plan of origen) {
      if (existentes.has(plan.rolServicioId)) {
        omitidos += 1;
        continue;
      }
      const creado = await tx.planRolServicio.create({
        data: {
          rolServicioId: plan.rolServicioId,
          anio: destinoAnio,
          mes: destinoMes,
          nombre: plan.nombre,
          categoria: plan.categoria,
          conAutoridad: plan.conAutoridad,
          papelNocturno: plan.papelNocturno,
          sellado: false,
        },
        select: { id: true },
      });
      if (plan.asignaciones.length > 0) {
        await tx.asignacionRolServicio.createMany({
          data: plan.asignaciones.map((persona) => ({
            planId: creado.id,
            orden: persona.orden,
            grado: persona.grado,
            nombre: persona.nombre,
            aspiranteId: persona.aspiranteId,
            autoridadId: persona.autoridadId,
            dias: [],
          })),
        });
      }
      copiados += 1;
    }
  });

  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.personal.rolesServicioEstudio);
  return { ok: true, copiados, omitidos };
}
