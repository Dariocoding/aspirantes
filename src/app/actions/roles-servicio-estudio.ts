"use server";

import { revalidatePath } from "next/cache";
import { abrevJerarquiaAspirante } from "@src/lib/aspirantes/jerarquia-aspirante";
import { routes } from "@src/lib/apps/routes";
import { requireWriter } from "@src/lib/auth/guards";
import {
  claveDeRol,
  esCategoriaRol,
  esPapelNocturno,
  gradoAutoridadCorto,
  marcasPorCupoDe,
  type CategoriaRol,
  type PapelNocturno,
} from "@src/lib/roles-servicio/catalogo-rol";
import {
  generarCalendarioMultiRol,
  fusionarMarcas,
} from "@src/lib/roles-servicio/generar-rotacion";
import { marcasDesdeJson, type MarcaDia } from "@src/lib/roles-servicio/marcas";
import { foldBusqueda } from "@src/lib/text/fold";
import { prisma } from "@src/lib/prisma";

export type AspiranteEstudio = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  grado: string;
};

export type PersonaEstudioInput = {
  asignacionId: string | null;
  aspiranteId: string | null;
  autoridadId: string | null;
  nombre: string;
  grado: string;
};

export type RolEstudioInput = {
  id: string | null;
  nombre: string;
  categoria: CategoriaRol;
  conAutoridad: boolean;
  papelNocturno: PapelNocturno;
  incluido: boolean;
  cuposPorDia: number;
  personas: PersonaEstudioInput[];
};

export type PublicarEstudioInput = {
  anio: number;
  mes: number;
  dias: number[];
  seed: number;
  curso: string;
  roles: RolEstudioInput[];
};

export type PublicarEstudioResult = { ok: true } | { ok: false; message: string };

export async function buscarAspirantesEstudio(consulta: string): Promise<AspiranteEstudio[]> {
  await requireWriter();
  const texto = consulta.trim();
  const q = foldBusqueda(texto);
  const cedula = texto.replace(/\D/g, "");
  if (q.length < 2 && cedula.length < 3) return [];

  const or: Array<{ nombresBusqueda?: { contains: string }; apellidosBusqueda?: { contains: string }; cedula?: { contains: string } }> = [];
  if (q.length >= 2) {
    or.push({ nombresBusqueda: { contains: q } });
    or.push({ apellidosBusqueda: { contains: q } });
  }
  if (cedula.length >= 3) or.push({ cedula: { contains: cedula } });

  const rows = await prisma.aspirante.findMany({
    where: { deletedAt: null, OR: or },
    take: 12,
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    select: { id: true, nombres: true, apellidos: true, cedula: true, jerarquia: true },
  });

  return rows.map((row) => ({
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    cedula: row.cedula,
    grado: abrevJerarquiaAspirante(row.jerarquia),
  }));
}

export async function publicarEstudio(input: PublicarEstudioInput): Promise<PublicarEstudioResult> {
  await requireWriter();

  const anio = Math.floor(input.anio);
  const mes = Math.floor(input.mes);
  if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12) {
    return { ok: false, message: "El mes no es válido." };
  }

  const ultimo = new Date(anio, mes, 0).getDate();
  const dias = [...new Set(input.dias.map((dia) => Math.floor(dia)))]
    .filter((dia) => dia >= 1 && dia <= ultimo)
    .sort((a, b) => a - b);

  const incluidos = input.roles.filter((rol) => rol.incluido);
  if (incluidos.length === 0) {
    return { ok: false, message: "Elige al menos un rol para este mes." };
  }
  for (const rol of incluidos) {
    if (rol.nombre.trim().length < 3) {
      return { ok: false, message: "Cada rol marcado necesita un nombre de al menos 3 letras." };
    }
    if (!esCategoriaRol(rol.categoria) || !esPapelNocturno(rol.papelNocturno)) {
      return { ok: false, message: "Hay un rol con categoría o turno de noche desconocido." };
    }
  }

  const roles = incluidos;
  const curso = input.curso.trim() || "CEFOA";

  const mesSellado = await prisma.planRolServicio.findFirst({
    where: { anio, mes, sellado: true },
    select: { id: true },
  });
  if (mesSellado) {
    return {
      ok: false,
      message: "Este mes está sellado. Las guardias ya quedaron y un cambio de personal no las modifica.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existentes = await tx.rolServicio.findMany({ select: { id: true, clave: true } });
      const clavesUsadas = new Set(existentes.map((rol) => rol.clave));
      const idsConocidos = new Set(existentes.map((rol) => rol.id));
      const maxOrden = await tx.rolServicio.aggregate({ _max: { sortOrder: true } });
      let sort = (maxOrden._max.sortOrder ?? 0) + 1;

      type RolListo = {
        rolId: string;
        clave: string;
        nombre: string;
        categoria: CategoriaRol;
        conAutoridad: boolean;
        incluido: boolean;
        cupos: number;
        papel: PapelNocturno;
        personas: PersonaEstudioInput[];
      };
      const listos: RolListo[] = [];

      for (const rol of roles) {
        const nombre = rol.nombre.trim().replace(/\s+/g, " ");
        const cupos = Math.max(1, Math.min(8, Math.floor(rol.cuposPorDia) || 1));
        let registroId: string;
        let clave: string;

        if (rol.id) {
          if (!idsConocidos.has(rol.id)) {
            throw new Error("Uno de los roles ya no existe. Vuelve a abrir el estudio.");
          }
          const actual = await tx.rolServicio.findUnique({
            where: { id: rol.id },
            select: { id: true, clave: true },
          });
          if (!actual) {
            throw new Error("Uno de los roles ya no existe. Vuelve a abrir el estudio.");
          }
          registroId = actual.id;
          clave = actual.clave;
        } else {
          clave = claveDeRol(nombre, curso);
          let n = 2;
          while (clavesUsadas.has(clave)) {
            clave = `${claveDeRol(nombre, curso)}-${n}`;
            n += 1;
          }
          clavesUsadas.add(clave);
          const creado = await tx.rolServicio.create({
            data: {
              clave,
              nombre,
              curso,
              sortOrder: sort,
              categoria: rol.categoria,
              conAutoridad: rol.conAutoridad,
              papelNocturno: rol.papelNocturno,
            },
            select: { id: true, clave: true },
          });
          sort += 1;
          registroId = creado.id;
          clave = creado.clave;
        }

        listos.push({
          rolId: registroId,
          clave,
          nombre,
          categoria: rol.categoria,
          conAutoridad: rol.conAutoridad,
          incluido: rol.incluido,
          cupos,
          papel: rol.papelNocturno,
          personas: rol.personas,
        });
      }

      type SlotGen = {
        asignacionId: string;
        aspiranteId: string | null;
        autoridadId: string | null;
        nombre: string;
        diasPrevios: MarcaDia[];
        papel: PapelNocturno;
        cupos: number;
        clave: string;
      };
      const slots: SlotGen[] = [];

      for (const rol of listos) {
        if (!rol.incluido) continue;
        const plan = await tx.planRolServicio.upsert({
          where: {
            rolServicioId_anio_mes: { rolServicioId: rol.rolId, anio, mes },
          },
          create: {
            rolServicioId: rol.rolId,
            anio,
            mes,
            nombre: rol.nombre,
            categoria: rol.categoria,
            conAutoridad: rol.conAutoridad,
            papelNocturno: rol.papel,
          },
          update: {
            nombre: rol.nombre,
            categoria: rol.categoria,
            conAutoridad: rol.conAutoridad,
            papelNocturno: rol.papel,
          },
          select: { id: true },
        });
        const actuales = await tx.asignacionRolServicio.findMany({ where: { planId: plan.id } });
        const aspiranteIds = rol.personas
          .map((persona) => persona.aspiranteId)
          .filter((id): id is string => Boolean(id));
        const autoridadIds = rol.personas
          .map((persona) => persona.autoridadId)
          .filter((id): id is string => Boolean(id));
        const aspirantesDb =
          aspiranteIds.length === 0
            ? []
            : await tx.aspirante.findMany({
                where: { id: { in: aspiranteIds }, deletedAt: null },
                select: { id: true, nombres: true, apellidos: true, jerarquia: true },
              });
        const autoridadesDb =
          autoridadIds.length === 0
            ? []
            : await tx.autoridad.findMany({
                where: { id: { in: autoridadIds }, activa: true },
                select: { id: true, nombres: true, apellidos: true, jerarquia: true },
              });
        const porAspirante = new Map(aspirantesDb.map((item) => [item.id, item]));
        const porAutoridad = new Map(autoridadesDb.map((item) => [item.id, item]));
        const conservar = new Set<string>();
        let orden = 1;

        for (const persona of rol.personas) {
          let nombre = persona.nombre.trim();
          let grado = persona.grado.trim() || "—";
          let aspiranteId: string | null = null;
          let autoridadId: string | null = null;

          if (persona.autoridadId) {
            const autoridad = porAutoridad.get(persona.autoridadId);
            if (!autoridad) continue;
            autoridadId = autoridad.id;
            nombre = `${autoridad.nombres} ${autoridad.apellidos}`.trim();
            grado = gradoAutoridadCorto(autoridad.jerarquia);
          } else if (persona.aspiranteId) {
            const aspirante = porAspirante.get(persona.aspiranteId);
            if (!aspirante) continue;
            aspiranteId = aspirante.id;
            nombre = `${aspirante.nombres} ${aspirante.apellidos}`.trim();
            grado = abrevJerarquiaAspirante(aspirante.jerarquia);
          } else if (persona.asignacionId) {
            const previaSuelta = actuales.find((item) => item.id === persona.asignacionId);
            if (!previaSuelta) continue;
            nombre = previaSuelta.nombre;
            grado = previaSuelta.grado;
            aspiranteId = previaSuelta.aspiranteId;
            autoridadId = previaSuelta.autoridadId;
          } else {
            continue;
          }

          const previa = persona.asignacionId
            ? actuales.find((item) => item.id === persona.asignacionId)
            : actuales.find(
                (item) =>
                  (aspiranteId != null && item.aspiranteId === aspiranteId) ||
                  (autoridadId != null && item.autoridadId === autoridadId),
              );

          let asignacionId: string;
          if (previa && previa.planId === plan.id) {
            asignacionId = previa.id;
            await tx.asignacionRolServicio.update({
              where: { id: asignacionId },
              data: { orden, grado, nombre, aspiranteId, autoridadId },
            });
          } else {
            const creada = await tx.asignacionRolServicio.create({
              data: {
                planId: plan.id,
                orden,
                grado,
                nombre,
                aspiranteId,
                autoridadId,
                dias: [],
              },
              select: { id: true },
            });
            asignacionId = creada.id;
          }

          conservar.add(asignacionId);
          slots.push({
            asignacionId,
            aspiranteId,
            autoridadId,
            nombre,
            diasPrevios: marcasDesdeJson(previa?.dias),
            papel: rol.papel,
            cupos: rol.cupos,
            clave: rol.clave,
          });
          orden += 1;
        }

        const sobrantes = actuales.filter((item) => !conservar.has(item.id)).map((item) => item.id);
        if (sobrantes.length > 0) {
          await tx.asignacionRolServicio.deleteMany({ where: { id: { in: sobrantes } } });
        }
      }

      if (dias.length > 0 && slots.length > 0) {
        const porClave = new Map<string, SlotGen[]>();
        for (const slot of slots) {
          const lista = porClave.get(slot.clave) ?? [];
          lista.push(slot);
          porClave.set(slot.clave, lista);
        }
        const generado = generarCalendarioMultiRol({
          roles: [...porClave.entries()].map(([clave, grupo]) => ({
            clave,
            personas: grupo.map((slot) => ({
              asignacionId: slot.asignacionId,
              aspiranteId: slot.aspiranteId,
              autoridadId: slot.autoridadId,
              nombre: slot.nombre,
            })),
            cuposPorDia: grupo[0]?.cupos ?? 1,
            marcasPorCupo: marcasPorCupoDe(grupo[0]?.papel ?? "NINGUNO", grupo[0]?.cupos ?? 1),
          })),
          desdeDia: dias[0] ?? 1,
          hastaDia: dias[dias.length - 1] ?? ultimo,
          dias,
          seed: input.seed >>> 0,
        });
        const nuevas = new Map(generado.porAsignacion.map((item) => [item.asignacionId, item.dias]));
        for (const slot of slots) {
          const fusion = fusionarMarcas({
            existentes: slot.diasPrevios,
            nuevas: nuevas.get(slot.asignacionId) ?? [],
            desdeDia: dias[0] ?? 1,
            hastaDia: dias[dias.length - 1] ?? ultimo,
            dias,
            reemplazarRango: true,
          });
          await tx.asignacionRolServicio.update({
            where: { id: slot.asignacionId },
            data: { dias: fusion },
          });
        }
      }
    }, { timeout: 20000 });

    revalidatePath(routes.personal.rolesServicio);
    revalidatePath(routes.personal.rolesServicioEstudio);
    return { ok: true };
  } catch (error) {
    console.error("[roles-servicio-estudio]", error);
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("Uno de los roles") || message.startsWith("Cada rol")) {
      return { ok: false, message };
    }
    return { ok: false, message: "No se pudo guardar el mes. Inténtalo de nuevo." };
  }
}
