"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@src/lib/prisma";
import { CalificacionAdmision, TipoEsquela } from "@src/generated/prisma";
import { requireWriter } from "@src/lib/auth/guards";
import { routes } from "@src/lib/apps/routes";
import { forbidden, redirect } from "next/navigation";

export async function createBirthdayEsquela(formData: FormData) {
  await requireWriter();
  const aspiranteId = String(formData.get("aspiranteId"));
  const aspirante = await prisma.aspirante.findUniqueOrThrow({ where: { id: aspiranteId } });
  if (aspirante.calificacionAdmision === CalificacionAdmision.NO_APTO) forbidden();

  const esquela = await prisma.esquela.create({
    data: {
      tipo: TipoEsquela.CUMPLEANOS,
      titulo: `Felicitaciones de Cumpleaños: ${aspirante.nombres} ${aspirante.apellidos}`,
      cuerpo: `Deseamos que la bendición de Dios todopoderoso le acompañe siempre en este nuevo año de vida y que siga cumpliendo muchos años más de Feliz Existencia al lado de su amada Familia.`,
      fechaEvento: new Date(),
      aspiranteId,
    },
  });

  revalidatePath(routes.personal.esquelas);
  redirect(routes.personal.esquela(esquela.id));
}

export async function createEfemerideEsquela(formData: FormData) {
  await requireWriter();
  const efemerideId = String(formData.get("efemerideId"));
  const efemeride = await prisma.efemeride.findUniqueOrThrow({ where: { id: efemerideId } });

  const esquela = await prisma.esquela.create({
    data: {
      tipo: TipoEsquela.EFEMERIDE,
      titulo: `Conmemoración: ${efemeride.nombre}`,
      cuerpo: `La unidad militar conmemora ${efemeride.nombre}.`,
      fechaEvento: new Date(),
      efemerideId,
    },
  });

  revalidatePath(routes.personal.esquelas);
  redirect(routes.personal.esquela(esquela.id));
}
