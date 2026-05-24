"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CalificacionAdmision, TipoEsquela } from "@/generated/prisma";
import { requireWriter } from "@/lib/auth/guards";
import { forbidden } from "next/navigation";

export async function createBirthdayEsquela(formData: FormData) {
  await requireWriter();
  const aspiranteId = String(formData.get("aspiranteId"));
  const aspirante = await prisma.aspirante.findUniqueOrThrow({ where: { id: aspiranteId } });
  if (aspirante.calificacionAdmision === CalificacionAdmision.NO_APTO) forbidden();

  await prisma.esquela.create({
    data: {
      tipo: TipoEsquela.CUMPLEANOS,
      titulo: `Felicitaciones de Cumpleaños: ${aspirante.nombres} ${aspirante.apellidos}`,
      cuerpo: `La unidad militar extiende sus felicitaciones a ${aspirante.nombres} ${aspirante.apellidos} en su día de cumpleaños.`,
      fechaEvento: new Date(),
      aspiranteId,
    },
  });

  revalidatePath("/esquelas");
}

export async function createEfemerideEsquela(formData: FormData) {
  await requireWriter();
  const efemerideId = String(formData.get("efemerideId"));
  const efemeride = await prisma.efemeride.findUniqueOrThrow({ where: { id: efemerideId } });

  await prisma.esquela.create({
    data: {
      tipo: TipoEsquela.EFEMERIDE,
      titulo: `Conmemoración: ${efemeride.nombre}`,
      cuerpo: `La unidad militar conmemora ${efemeride.nombre}.`,
      fechaEvento: new Date(),
      efemerideId,
    },
  });

  revalidatePath("/esquelas");
}
