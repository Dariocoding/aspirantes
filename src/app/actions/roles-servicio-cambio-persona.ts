"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@src/auth";
import { abrevJerarquiaAspirante } from "@src/lib/aspirantes/jerarquia-aspirante";
import { routes } from "@src/lib/apps/routes";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { labelPeloton } from "@src/lib/pelotones";
import { marcasDesdeJson, type MarcaDia } from "@src/lib/roles-servicio/marcas";
import {
  etiquetaSubdivision,
  subdivisionDesdeNombreRol,
} from "@src/lib/roles-servicio/subdivision-rol";
import { foldBusqueda } from "@src/lib/text/fold";
import { prisma } from "@src/lib/prisma";

export type CandidatoCensoGuardia = {
  aspiranteId: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  grado: string;
  peloton: string | null;
  sexo: "MASCULINO" | "FEMENINO";
};

export type BuscarCensoGuardiaResult =
  | { ok: true; subdivision: string; candidatos: CandidatoCensoGuardia[] }
  | { ok: false; message: string };

export type TraerPersonaGuardiaResult =
  | {
      ok: true;
      asignacionId: string;
      orden: number;
      grado: string;
      nombre: string;
      dias: MarcaDia[];
      aspirante: {
        id: string;
        nombres: string;
        apellidos: string;
        cedula: string;
        fotoKey: string | null;
      };
      origenDias: MarcaDia[];
    }
  | { ok: false; message: string };

function conMarcaEnDia(dias: MarcaDia[], dia: number, marca: string | null): MarcaDia[] {
  const sinDia = dias.filter((item) => item.dia !== dia);
  if (!marca) return sinDia;
  return [...sinDia, { dia, marca }].sort((a, b) => a.dia - b.dia);
}

/** Busca aspirantes del censo que encajan en el sexo/pelotón del rol y aún no están en él. */
export async function buscarCensoParaGuardia(input: {
  anio: number;
  mes: number;
  claveRol: string;
  consulta: string;
}): Promise<BuscarCensoGuardiaResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso." };
  }

  const anio = Math.floor(input.anio);
  const mes = Math.floor(input.mes);
  if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12) {
    return { ok: false, message: "El mes no es válido." };
  }

  const plan = await prisma.planRolServicio.findFirst({
    where: { anio, mes, rol: { clave: input.claveRol } },
    select: {
      nombre: true,
      conAutoridad: true,
      asignaciones: { select: { aspiranteId: true } },
    },
  });
  if (!plan) return { ok: false, message: "No está ese rol en el mes." };
  if (plan.conAutoridad) {
    return { ok: true, subdivision: "autoridades", candidatos: [] };
  }

  const sub = subdivisionDesdeNombreRol(plan.nombre);
  const texto = input.consulta.trim();
  const q = foldBusqueda(texto);
  const cedula = texto.replace(/\D/g, "");
  const tieneFiltroSubdivision = sub.sexo != null || sub.pelotonNumero != null;
  const tieneConsulta = q.length >= 2 || cedula.length >= 3;

  // Sin sexo/pelotón en el rol, hace falta buscar por nombre para no volcar el censo entero.
  if (!tieneFiltroSubdivision && !tieneConsulta) {
    return { ok: true, subdivision: etiquetaSubdivision(sub), candidatos: [] };
  }

  const yaEnRol = new Set(
    plan.asignaciones.map((item) => item.aspiranteId).filter((id): id is string => Boolean(id)),
  );

  const or: Array<
    | { nombresBusqueda: { contains: string } }
    | { apellidosBusqueda: { contains: string } }
    | { cedula: { contains: string } }
  > = [];
  if (q.length >= 2) {
    or.push({ nombresBusqueda: { contains: q } });
    or.push({ apellidosBusqueda: { contains: q } });
  }
  if (cedula.length >= 3) or.push({ cedula: { contains: cedula } });

  const rows = await prisma.aspirante.findMany({
    where: {
      deletedAt: null,
      ...(or.length > 0 ? { OR: or } : {}),
      ...(sub.sexo ? { sexo: sub.sexo } : {}),
      ...(sub.pelotonNumero != null ? { peloton: { numero: sub.pelotonNumero } } : {}),
      ...(yaEnRol.size > 0 ? { id: { notIn: [...yaEnRol] } } : {}),
    },
    take: tieneConsulta ? 30 : 60,
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      cedula: true,
      sexo: true,
      jerarquia: true,
      peloton: { select: { numero: true, nombre: true } },
    },
  });

  return {
    ok: true,
    subdivision: etiquetaSubdivision(sub),
    candidatos: rows.map((row) => ({
      aspiranteId: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      cedula: row.cedula,
      grado: abrevJerarquiaAspirante(row.jerarquia),
      peloton: row.peloton ? labelPeloton(row.peloton) : null,
      sexo: row.sexo,
    })),
  };
}

/**
 * Trae a un aspirante del censo al rol (si aún no está) y le pasa la marca del día
 * desde la asignación de origen.
 */
export async function traerPersonaAGuardiaDia(input: {
  origenAsignacionId: string;
  aspiranteId: string;
  dia: number;
  marcaPorDefecto?: string;
}): Promise<TraerPersonaGuardiaResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para cambiar la guardia." };
  }

  const dia = Math.floor(input.dia);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
    return { ok: false, message: "El día no es válido." };
  }

  const origen = await prisma.asignacionRolServicio.findUnique({
    where: { id: input.origenAsignacionId },
    select: {
      id: true,
      dias: true,
      aspiranteId: true,
      plan: {
        select: {
          id: true,
          nombre: true,
          conAutoridad: true,
          sellado: true,
          asignaciones: {
            orderBy: { orden: "desc" },
            select: { id: true, orden: true, aspiranteId: true, dias: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!origen) return { ok: false, message: "Asignación no encontrada." };
  if (origen.plan.sellado) {
    return { ok: false, message: "Este mes está sellado. Las guardias no se modifican." };
  }
  if (origen.plan.conAutoridad) {
    return { ok: false, message: "Este rol es de autoridades." };
  }
  if (origen.aspiranteId === input.aspiranteId) {
    return { ok: false, message: "Es la misma persona." };
  }

  const sub = subdivisionDesdeNombreRol(origen.plan.nombre);
  const aspirante = await prisma.aspirante.findFirst({
    where: {
      id: input.aspiranteId,
      deletedAt: null,
      ...(sub.sexo ? { sexo: sub.sexo } : {}),
      ...(sub.pelotonNumero != null ? { peloton: { numero: sub.pelotonNumero } } : {}),
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      cedula: true,
      fotoKey: true,
      jerarquia: true,
    },
  });
  if (!aspirante) {
    const detalle = etiquetaSubdivision(sub);
    return {
      ok: false,
      message: detalle
        ? `Esa persona no encaja en este rol (${detalle}).`
        : "Aspirante no encontrado.",
    };
  }

  const existente = await prisma.asignacionRolServicio.findFirst({
    where: { planId: origen.plan.id, aspiranteId: aspirante.id },
    select: { id: true, orden: true, dias: true },
  });

  const diasOrigen = marcasDesdeJson(origen.dias);
  const marcaOrigen = diasOrigen.find((item) => item.dia === dia)?.marca ?? null;
  const marcaNueva = marcaOrigen ?? (input.marcaPorDefecto?.trim().toUpperCase() || "X");
  const diasDestinoPrevios = marcasDesdeJson(existente?.dias);
  const marcaDestino = diasDestinoPrevios.find((item) => item.dia === dia)?.marca ?? null;

  // Si el destino ya tenía marca, se la deja al origen (intercambio).
  const origenDias = conMarcaEnDia(diasOrigen, dia, marcaDestino);
  const destinoDias = conMarcaEnDia(diasDestinoPrevios, dia, marcaNueva);

  const nombre = `${aspirante.nombres} ${aspirante.apellidos}`.trim();
  const grado = abrevJerarquiaAspirante(aspirante.jerarquia);
  const siguienteOrden = (origen.plan.asignaciones[0]?.orden ?? 0) + 1;

  const resultado = await prisma.$transaction(async (tx) => {
    await tx.asignacionRolServicio.update({
      where: { id: origen.id },
      data: { dias: origenDias },
    });

    if (existente) {
      await tx.asignacionRolServicio.update({
        where: { id: existente.id },
        data: { dias: destinoDias, nombre, grado },
      });
      return { id: existente.id, orden: existente.orden };
    }

    const creada = await tx.asignacionRolServicio.create({
      data: {
        planId: origen.plan.id,
        orden: siguienteOrden,
        grado,
        nombre,
        aspiranteId: aspirante.id,
        dias: destinoDias,
      },
      select: { id: true, orden: true },
    });
    return creada;
  });

  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.personal.rolesServicioEstudio);

  return {
    ok: true,
    asignacionId: resultado.id,
    orden: resultado.orden,
    grado,
    nombre,
    dias: destinoDias,
    aspirante: {
      id: aspirante.id,
      nombres: aspirante.nombres,
      apellidos: aspirante.apellidos,
      cedula: aspirante.cedula,
      fotoKey: aspirante.fotoKey,
    },
    origenDias,
  };
}

export type SacarDelRolResult = { ok: true } | { ok: false; message: string };

/** Quita a la persona del rol del mes (y todas sus marcas). */
export async function sacarAsignacionDelRol(asignacionId: string): Promise<SacarDelRolResult> {
  const session = await auth();
  const ctx = session?.user ? authContextFromSession(session) : null;
  if (!session?.user || !ctx || !hasPermission(ctx, Permission.ASPIRANTES_WRITE)) {
    return { ok: false, message: "Sin permiso para sacar personal del rol." };
  }

  const asignacion = await prisma.asignacionRolServicio.findUnique({
    where: { id: asignacionId },
    select: {
      id: true,
      planId: true,
      plan: { select: { sellado: true } },
    },
  });
  if (!asignacion) return { ok: false, message: "Asignación no encontrada." };
  if (asignacion.plan.sellado) {
    return { ok: false, message: "Este mes está sellado. El personal no se modifica." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.asignacionRolServicio.delete({ where: { id: asignacion.id } });
    const restantes = await tx.asignacionRolServicio.findMany({
      where: { planId: asignacion.planId },
      orderBy: { orden: "asc" },
      select: { id: true, orden: true },
    });
    for (let i = 0; i < restantes.length; i++) {
      const item = restantes[i]!;
      const orden = i + 1;
      if (item.orden !== orden) {
        await tx.asignacionRolServicio.update({
          where: { id: item.id },
          data: { orden },
        });
      }
    }
  });

  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.personal.rolesServicioEstudio);
  return { ok: true };
}
