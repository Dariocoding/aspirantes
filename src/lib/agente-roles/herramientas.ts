import { revalidatePath } from "next/cache";
import type { CategoriaRolServicio, PapelNocturnoRol, Sexo } from "@src/generated/prisma";
import { routes } from "@src/lib/apps/routes";
import { abrevJerarquiaAspirante } from "@src/lib/aspirantes/jerarquia-aspirante";
import {
  pelotonDeclaradoEnRol,
  personaCoincide,
  rolCoincide,
  sexoDeclaradoEnRol,
  tokensBusqueda,
} from "@src/lib/agente-roles/coincidencias";
import { guardarSkillTexto, leerSkillGuardada } from "@src/lib/agente-roles/skill-store";
import { cuposSugeridos, inferirCategoria, inferirConAutoridad, inferirPapelNocturno, claveDeRol } from "@src/lib/roles-servicio/catalogo-rol";
import { diasDelMes, etiquetaMes, marcasDesdeJson, type MarcaDia } from "@src/lib/roles-servicio/marcas";
import { foldBusqueda } from "@src/lib/text/fold";
import { prisma } from "@src/lib/prisma";

export type ResultadoHerramienta = {
  data: Record<string, unknown>;
  paso?: string;
  skill?: string;
  escribio: boolean;
};

type Persona = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: Sexo;
  tituloUniversidad: string | null;
  jerarquia: string;
  peloton: { numero: number; nombre: string } | null;
};

type Asignacion = {
  id: string;
  orden: number;
  nombre: string;
  grado: string;
  aspiranteId: string | null;
  dias: MarcaDia[];
  aspirante: Persona | null;
};

function mismoNombre(a: string, b: string): boolean {
  const limpio = (value: string) => foldBusqueda(value).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  return limpio(a) === limpio(b);
}

type Plan = {
  id: string;
  rolServicioId: string;
  nombre: string;
  sellado: boolean;
  categoria: CategoriaRolServicio;
  papelNocturno: PapelNocturnoRol;
  conAutoridad: boolean;
  asignaciones: Asignacion[];
};

const MARCAS_TURNO = ["T1", "T2", "T3"];

function fallo(resumen: string, extra?: Record<string, unknown>): ResultadoHerramienta {
  return { data: { ok: false, resumen, ...extra }, escribio: false };
}

function entero(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  if (!Number.isInteger(n)) return null;
  return n;
}

function texto(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function periodo(args: Record<string, unknown>): { anio: number; mes: number } | null {
  const anio = entero(args.anio);
  const mes = entero(args.mes);
  if (anio == null || anio < 2000 || anio > 2100 || mes == null || mes < 1 || mes > 12) return null;
  return { anio, mes };
}

function nombreCompleto(persona: { apellidos: string; nombres: string }): string {
  return `${persona.apellidos} ${persona.nombres}`.replace(/\s+/g, " ").trim();
}

function fichaCorta(persona: Persona) {
  return {
    nombre: nombreCompleto(persona),
    cedula: persona.cedula,
    sexo: persona.sexo === "FEMENINO" ? "femenino" : "masculino",
    peloton: persona.peloton ? `${persona.peloton.numero} ${persona.peloton.nombre}` : "sin pelotón",
    titulo: persona.tituloUniversidad?.trim() || null,
  };
}

async function cargarPersonas(): Promise<Persona[]> {
  return prisma.aspirante.findMany({
    where: { pelotonId: { not: null } },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      cedula: true,
      sexo: true,
      tituloUniversidad: true,
      jerarquia: true,
      peloton: { select: { numero: true, nombre: true } },
    },
    take: 400,
  });
}

async function cargarMes(anio: number, mes: number): Promise<Plan[]> {
  const planes = await prisma.planRolServicio.findMany({
    where: { anio, mes },
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      rolServicioId: true,
      nombre: true,
      sellado: true,
      categoria: true,
      papelNocturno: true,
      conAutoridad: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        select: {
          id: true,
          orden: true,
          nombre: true,
          grado: true,
          aspiranteId: true,
          dias: true,
          aspirante: {
            select: {
              id: true,
              nombres: true,
              apellidos: true,
              cedula: true,
              sexo: true,
              tituloUniversidad: true,
              jerarquia: true,
              peloton: { select: { numero: true, nombre: true } },
            },
          },
        },
      },
    },
  });
  return planes.map((plan) => ({
    ...plan,
    asignaciones: plan.asignaciones.map((fila) => ({
      ...fila,
      dias: marcasDesdeJson(fila.dias),
    })),
  }));
}

function mesSellado(planes: Plan[]): boolean {
  return planes.some((plan) => plan.sellado);
}

function elegirPersona(personas: Persona[], consulta: string): { persona?: Persona; candidatos?: ReturnType<typeof fichaCorta>[] } {
  if (tokensBusqueda(consulta).length === 0) return {};
  const coinciden = personas.filter((persona) => personaCoincide(persona, consulta));
  if (coinciden.length === 1) return { persona: coinciden[0] };
  if (coinciden.length > 1) return { candidatos: coinciden.slice(0, 8).map(fichaCorta) };
  return {};
}

function elegirPlan(planes: Plan[], consulta: string): { plan?: Plan; opciones?: string[] } {
  const coinciden = planes.filter((plan) => rolCoincide(plan.nombre, consulta));
  if (coinciden.length === 1) return { plan: coinciden[0] };
  if (coinciden.length > 1) return { opciones: coinciden.map((plan) => plan.nombre) };
  return {};
}

function marcasDelDia(plan: Plan, dia: number, excepto?: string): { nombre: string; marca: string }[] {
  const ocupantes: { nombre: string; marca: string }[] = [];
  for (const fila of plan.asignaciones) {
    if (excepto && fila.aspiranteId === excepto) continue;
    const marca = fila.dias.find((item) => item.dia === dia);
    if (!marca) continue;
    ocupantes.push({ nombre: fila.nombre || "Sin nombre", marca: marca.marca });
  }
  return ocupantes;
}

function otrasDelDia(planes: Plan[], aspiranteId: string, dia: number, exceptoPlanId: string): string[] {
  const roles: string[] = [];
  for (const plan of planes) {
    if (plan.id === exceptoPlanId) continue;
    for (const fila of plan.asignaciones) {
      if (fila.aspiranteId !== aspiranteId) continue;
      if (fila.dias.some((item) => item.dia === dia)) roles.push(plan.nombre);
    }
  }
  return roles;
}

function marcarRevalidar() {
  revalidatePath(routes.personal.rolesServicio);
  revalidatePath(routes.sistema.roles);
}

async function resumirMes(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const cuando = periodo(args);
  if (!cuando) return fallo("Indica año y mes válidos.");
  const tope = diasDelMes(cuando.anio, cuando.mes);
  const desde = Math.max(1, entero(args.desde) ?? 1);
  const hasta = Math.min(tope, entero(args.hasta) ?? tope);
  if (desde > hasta) return fallo("El rango de días está al revés.");

  const [planes, personas] = await Promise.all([cargarMes(cuando.anio, cuando.mes), cargarPersonas()]);
  const porPersona = new Map<string, { dias: Set<number>; detalle: string[] }>();
  for (const plan of planes) {
    for (const fila of plan.asignaciones) {
      if (!fila.aspiranteId) continue;
      const propios = fila.dias.filter((item) => item.dia >= desde && item.dia <= hasta);
      if (propios.length === 0) continue;
      const actual = porPersona.get(fila.aspiranteId) ?? { dias: new Set<number>(), detalle: [] };
      for (const item of propios) actual.dias.add(item.dia);
      actual.detalle.push(propios.map((item) => `${item.dia} ${plan.nombre}`).join(", "));
      porPersona.set(fila.aspiranteId, actual);
    }
  }

  const histograma: Record<string, number> = {};
  const lista = personas
    .map((persona) => {
      const carga = porPersona.get(persona.id);
      const dias = carga?.dias.size ?? 0;
      histograma[String(dias)] = (histograma[String(dias)] ?? 0) + 1;
      return {
        ...fichaCorta(persona),
        dias,
        detalle: carga?.detalle.join(" | ") ?? "",
      };
    })
    .sort((a, b) => b.dias - a.dias || a.nombre.localeCompare(b.nombre, "es"));

  return {
    escribio: false,
    data: {
      ok: true,
      resumen: `${etiquetaMes(cuando.anio, cuando.mes)}, días ${desde} a ${hasta}. ${lista.length} aspirantes con pelotón.`,
      sellado: mesSellado(planes),
      roles: planes.map((plan) => ({
        nombre: plan.nombre,
        categoria: plan.categoria,
        papelNocturno: plan.papelNocturno,
        autoridad: plan.conAutoridad,
        personas: plan.asignaciones.length,
      })),
      histograma,
      conMarca: lista.filter((persona) => persona.dias > 0),
      sinMarca: lista.filter((persona) => persona.dias === 0).map((persona) => `${persona.nombre} (${persona.sexo}, ${persona.peloton}${persona.titulo ? `, ${persona.titulo}` : ""})`),
    },
  };
}

async function buscar(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const consulta = texto(args.texto);
  if (!consulta) return fallo("Escribe el nombre o la cédula.");
  const personas = await cargarPersonas();
  const coinciden = personas.filter((persona) => personaCoincide(persona, consulta)).slice(0, 8);
  if (coinciden.length === 0) return fallo(`No encontré a «${consulta}».`);
  return {
    escribio: false,
    data: {
      ok: true,
      resumen: coinciden.length === 1 ? nombreCompleto(coinciden[0]!) : `${coinciden.length} coincidencias.`,
      personas: coinciden.map(fichaCorta),
    },
  };
}

async function marcasDe(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const cuando = periodo(args);
  if (!cuando) return fallo("Indica año y mes válidos.");
  const consulta = texto(args.persona);
  const personas = await cargarPersonas();
  const hallada = elegirPersona(personas, consulta);
  if (!hallada.persona) {
    return fallo(hallada.candidatos ? "Hay varias personas con ese nombre." : `No encontré a «${consulta}».`, {
      candidatos: hallada.candidatos ?? [],
    });
  }
  const planes = await cargarMes(cuando.anio, cuando.mes);
  const marcas = [];
  for (const plan of planes) {
    for (const fila of plan.asignaciones) {
      if (fila.aspiranteId !== hallada.persona.id || fila.dias.length === 0) continue;
      marcas.push({ rol: plan.nombre, dias: fila.dias });
    }
  }
  return {
    escribio: false,
    data: {
      ok: true,
      resumen: marcas.length === 0 ? `${nombreCompleto(hallada.persona)} no tiene marcas en ${etiquetaMes(cuando.anio, cuando.mes)}.` : `${nombreCompleto(hallada.persona)} tiene ${marcas.length} rol(es).`,
      persona: fichaCorta(hallada.persona),
      marcas,
    },
  };
}

function rechazoEstructural(plan: Plan, persona: Persona): string | null {
  if (plan.conAutoridad) return `${plan.nombre} es un rol de autoridades, no de aspirantes.`;
  const sexo = sexoDeclaradoEnRol(plan.nombre);
  if (sexo && sexo !== persona.sexo) {
    return `${plan.nombre} es ${sexo === "FEMENINO" ? "femenino" : "masculino"} y ${nombreCompleto(persona)} no coincide.`;
  }
  const peloton = pelotonDeclaradoEnRol(plan.nombre);
  if (peloton && persona.peloton?.numero !== peloton) {
    return `${plan.nombre} es del ${peloton}.º pelotón y ${nombreCompleto(persona)} está en el ${persona.peloton?.numero ?? "sin"} pelotón.`;
  }
  return null;
}

function elegirMarca(plan: Plan, dia: number, pedida: string, excepto?: string): { marca?: string; error?: string } {
  const ocupantes = marcasDelDia(plan, dia, excepto);
  if (plan.papelNocturno === "MARCA_TURNO") {
    const marca = (pedida || "").toUpperCase();
    const usada = new Set(ocupantes.map((item) => item.marca));
    if (marca && MARCAS_TURNO.includes(marca)) {
      if (usada.has(marca)) return { error: `${marca} del día ${dia} ya está ocupado en ${plan.nombre}.` };
      return { marca };
    }
    const libre = MARCAS_TURNO.find((item) => !usada.has(item));
    if (!libre) return { error: `Estacionamiento ya tiene T1, T2 y T3 el día ${dia}.` };
    return { marca: libre };
  }
  const cupos = cuposSugeridos(plan.nombre, plan.papelNocturno, plan.categoria);
  if (ocupantes.length >= cupos) {
    return { error: `El día ${dia} de ${plan.nombre} ya lo tiene ${ocupantes.map((item) => item.nombre).join(", ")}.` };
  }
  return { marca: (pedida || "X").toUpperCase() || "X" };
}

async function aplicarUna(
  planes: Plan[],
  personas: Persona[],
  cambio: Record<string, unknown>,
): Promise<{ ok: true; paso: string } | { ok: false; resumen: string }> {
  const accion = texto(cambio.accion).toLowerCase();
  if (accion !== "poner" && accion !== "quitar" && accion !== "sacar") {
    return { ok: false, resumen: "La acción debe ser poner, quitar o sacar." };
  }
  const hallada = elegirPersona(personas, texto(cambio.persona));
  if (!hallada.persona) {
    return {
      ok: false,
      resumen: hallada.candidatos
        ? `Varias personas coinciden con «${texto(cambio.persona)}».`
        : `No encontré a «${texto(cambio.persona)}».`,
    };
  }
  const elegido = elegirPlan(planes, texto(cambio.rol));
  if (!elegido.plan) {
    return {
      ok: false,
      resumen: elegido.opciones
        ? `Varios roles coinciden con «${texto(cambio.rol)}»: ${elegido.opciones.join(", ")}.`
        : `No encontré el rol «${texto(cambio.rol)}» en ese mes.`,
    };
  }
  const plan = elegido.plan;
  const persona = hallada.persona;
  if (accion === "poner") {
    const rechazo = rechazoEstructural(plan, persona);
    if (rechazo) return { ok: false, resumen: rechazo };
  }

  const fila = plan.asignaciones.find((item) => item.aspiranteId === persona.id);

  if (accion === "sacar") {
    if (!fila) return { ok: false, resumen: `${nombreCompleto(persona)} no está en ${plan.nombre}.` };
    await prisma.asignacionRolServicio.delete({ where: { id: fila.id } });
    plan.asignaciones = plan.asignaciones.filter((item) => item.id !== fila.id);
    return { ok: true, paso: `Saqué a ${nombreCompleto(persona)} de ${plan.nombre}.` };
  }

  const dia = entero(cambio.dia);
  if (dia == null || dia < 1 || dia > 31) return { ok: false, resumen: "El día tiene que estar entre 1 y 31." };

  if (accion === "quitar") {
    if (!fila || !fila.dias.some((item) => item.dia === dia)) {
      return { ok: false, resumen: `${nombreCompleto(persona)} no tiene el día ${dia} en ${plan.nombre}.` };
    }
    const dias = fila.dias.filter((item) => item.dia !== dia);
    if (dias.length === 0) {
      await prisma.asignacionRolServicio.delete({ where: { id: fila.id } });
      plan.asignaciones = plan.asignaciones.filter((item) => item.id !== fila.id);
    } else {
      await prisma.asignacionRolServicio.update({ where: { id: fila.id }, data: { dias } });
      fila.dias = dias;
    }
    return { ok: true, paso: `Quité a ${nombreCompleto(persona)} de ${plan.nombre} el día ${dia}.` };
  }

  const marca = elegirMarca(plan, dia, texto(cambio.marca), persona.id);
  if (!marca.marca) return { ok: false, resumen: marca.error ?? "No pude elegir la marca." };
  const otras = otrasDelDia(planes, persona.id, dia, plan.id);
  const siguientes = [...(fila?.dias.filter((item) => item.dia !== dia) ?? []), { dia, marca: marca.marca }].sort(
    (a, b) => a.dia - b.dia,
  );

  if (fila) {
    await prisma.asignacionRolServicio.update({ where: { id: fila.id }, data: { dias: siguientes } });
    fila.dias = siguientes;
  } else {
    const orden = plan.asignaciones.reduce((max, item) => Math.max(max, item.orden), 0) + 1;
    const creada = await prisma.asignacionRolServicio.create({
      data: {
        planId: plan.id,
        orden,
        grado: abrevJerarquiaAspirante(persona.jerarquia),
        nombre: nombreCompleto(persona),
        aspiranteId: persona.id,
        dias: siguientes,
      },
      select: { id: true },
    });
    plan.asignaciones.push({
      id: creada.id,
      orden,
      nombre: nombreCompleto(persona),
      grado: abrevJerarquiaAspirante(persona.jerarquia),
      aspiranteId: persona.id,
      dias: siguientes,
      aspirante: persona,
    });
  }

  const aviso = otras.length > 0 ? ` Ese día también está en ${otras.join(", ")}.` : "";
  return {
    ok: true,
    paso: `Puse a ${nombreCompleto(persona)} en ${plan.nombre} el día ${dia} (${marca.marca}).${aviso}`,
  };
}

async function aplicarCambios(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const cuando = periodo(args);
  if (!cuando) return fallo("Indica año y mes válidos.");
  const cambios = Array.isArray(args.cambios) ? args.cambios.filter((item) => item && typeof item === "object") : [];
  if (cambios.length === 0) return fallo("No enviaste cambios.");
  if (cambios.length > 40) return fallo("Máximo 40 cambios por vez.");

  const [planes, personas] = await Promise.all([cargarMes(cuando.anio, cuando.mes), cargarPersonas()]);
  if (mesSellado(planes)) return fallo(`${etiquetaMes(cuando.anio, cuando.mes)} está sellado.`);
  const tope = diasDelMes(cuando.anio, cuando.mes);

  const pasos: string[] = [];
  const errores: string[] = [];
  for (const cambio of cambios) {
    const dia = entero((cambio as Record<string, unknown>).dia);
    const accion = texto((cambio as Record<string, unknown>).accion).toLowerCase();
    if (accion !== "sacar" && dia != null && dia > tope) {
      errores.push(`El día ${dia} no existe en ${etiquetaMes(cuando.anio, cuando.mes)}.`);
      continue;
    }
    const resultado = await aplicarUna(planes, personas, cambio as Record<string, unknown>);
    if (resultado.ok) pasos.push(resultado.paso);
    else errores.push(resultado.resumen);
  }
  if (pasos.length > 0) marcarRevalidar();
  return {
    escribio: pasos.length > 0,
    paso: pasos.concat(errores.map((error) => `No apliqué: ${error}`)).join("\n"),
    data: {
      ok: errores.length === 0,
      resumen: `Apliqué ${pasos.length} cambio(s). ${errores.length} no se aplicaron.`,
      hechos: pasos,
      errores,
    },
  };
}

async function crearRol(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const cuando = periodo(args);
  const nombre = texto(args.nombre).replace(/\s+/g, " ");
  if (!cuando || nombre.length < 3) return fallo("Indica año, mes y el nombre del rol.");
  const planes = await cargarMes(cuando.anio, cuando.mes);
  if (mesSellado(planes)) return fallo(`${etiquetaMes(cuando.anio, cuando.mes)} está sellado.`);
  const ya = planes.find((plan) => mismoNombre(plan.nombre, nombre));
  if (ya) return fallo(`Ese mes ya tiene «${ya.nombre}».`);

  const catalogo = await prisma.rolServicio.findMany({
    select: { id: true, nombre: true, categoria: true, papelNocturno: true, conAutoridad: true },
  });
  const existente = catalogo.find((rol) => mismoNombre(rol.nombre, nombre));
  if (existente) {
    if (planes.some((plan) => plan.rolServicioId === existente.id)) {
      return fallo("Ese rol ya está publicado en el mes, con otro nombre visible.");
    }
    await prisma.planRolServicio.create({
      data: {
        rolServicioId: existente.id,
        anio: cuando.anio,
        mes: cuando.mes,
        nombre,
        categoria: existente.categoria,
        papelNocturno: existente.papelNocturno,
        conAutoridad: existente.conAutoridad,
      },
    });
  } else {
    const muestra = await prisma.rolServicio.findFirst({ orderBy: { sortOrder: "asc" }, select: { curso: true } });
    const curso = muestra?.curso || "CEFOA 46";
    const maximo = await prisma.rolServicio.aggregate({ _max: { sortOrder: true } });
    let clave = claveDeRol(nombre, curso);
    for (let n = 2; await prisma.rolServicio.findUnique({ where: { clave }, select: { id: true } }); n += 1) {
      clave = `${claveDeRol(nombre, curso)}-${n}`;
      if (n > 30) return fallo("No pude crear una clave única para el rol.");
    }
    const categoria = inferirCategoria(nombre);
    const papelNocturno = inferirPapelNocturno(nombre);
    const conAutoridad = inferirConAutoridad(nombre, false);
    await prisma.rolServicio.create({
      data: {
        clave,
        nombre,
        curso,
        sortOrder: (maximo._max.sortOrder ?? 0) + 1,
        categoria,
        papelNocturno,
        conAutoridad,
        planes: {
          create: {
            anio: cuando.anio,
            mes: cuando.mes,
            nombre,
            categoria,
            papelNocturno,
            conAutoridad,
          },
        },
      },
    });
  }
  marcarRevalidar();
  return {
    escribio: true,
    paso: `Creé el rol ${nombre} en ${etiquetaMes(cuando.anio, cuando.mes)}.`,
    data: {
      ok: true,
      resumen: `Rol creado. Categoría ${existente?.categoria ?? inferirCategoria(nombre)}, noche ${existente?.papelNocturno ?? inferirPapelNocturno(nombre)}. Aún no tiene personas.`,
    },
  };
}

async function renombrarRol(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const cuando = periodo(args);
  const actual = texto(args.nombre);
  const nuevo = texto(args.nombreNuevo).replace(/\s+/g, " ");
  if (!cuando || !actual || nuevo.length < 3) return fallo("Indica año, mes, el nombre actual y el nuevo.");
  const planes = await cargarMes(cuando.anio, cuando.mes);
  if (mesSellado(planes)) return fallo(`${etiquetaMes(cuando.anio, cuando.mes)} está sellado.`);
  const elegido = elegirPlan(planes, actual);
  if (!elegido.plan) {
    return fallo(elegido.opciones ? `Varios roles coinciden: ${elegido.opciones.join(", ")}.` : `No encontré «${actual}».`);
  }
  const categoria = inferirCategoria(nuevo);
  const papelNocturno = inferirPapelNocturno(nuevo);
  const conAutoridad = inferirConAutoridad(nuevo, elegido.plan.conAutoridad);
  await prisma.planRolServicio.update({
    where: { id: elegido.plan.id },
    data: { nombre: nuevo, categoria, papelNocturno, conAutoridad },
  });
  marcarRevalidar();
  return {
    escribio: true,
    paso: `Renombré ${elegido.plan.nombre} como ${nuevo} en ${etiquetaMes(cuando.anio, cuando.mes)}.`,
    data: { ok: true, resumen: "El cambio vale solo para ese mes." },
  };
}

async function eliminarRol(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const cuando = periodo(args);
  const nombre = texto(args.nombre);
  if (!cuando || !nombre) return fallo("Indica año, mes y el rol.");
  const planes = await cargarMes(cuando.anio, cuando.mes);
  if (mesSellado(planes)) return fallo(`${etiquetaMes(cuando.anio, cuando.mes)} está sellado.`);
  const elegido = elegirPlan(planes, nombre);
  if (!elegido.plan) {
    return fallo(elegido.opciones ? `Varios roles coinciden: ${elegido.opciones.join(", ")}.` : `No encontré «${nombre}».`);
  }
  const personas = elegido.plan.asignaciones.length;
  await prisma.planRolServicio.delete({ where: { id: elegido.plan.id } });
  marcarRevalidar();
  return {
    escribio: true,
    paso: `Eliminé ${elegido.plan.nombre} de ${etiquetaMes(cuando.anio, cuando.mes)} (${personas} persona(s)).`,
    data: {
      ok: true,
      resumen: "Quité el rol de ese mes y sus marcas. El catálogo puede seguir existiendo para otros meses.",
    },
  };
}

async function guardar(args: Record<string, unknown>): Promise<ResultadoHerramienta> {
  const guardada = await guardarSkillTexto(texto(args.texto));
  if (!guardada.ok) return fallo(guardada.message);
  return {
    escribio: true,
    skill: guardada.skill,
    paso: "Actualicé la skill del agente.",
    data: { ok: true, resumen: "Skill guardada. Las reglas nuevas ya valen para el siguiente paso." },
  };
}

export async function ejecutarHerramienta(
  nombre: string,
  args: Record<string, unknown>,
): Promise<ResultadoHerramienta> {
  try {
    switch (nombre) {
      case "leer_skill":
        return { escribio: false, data: { ok: true, resumen: "Skill actual.", texto: await leerSkillGuardada() } };
      case "guardar_skill":
        return await guardar(args);
      case "resumen_mes":
        return await resumirMes(args);
      case "buscar_persona":
        return await buscar(args);
      case "marcas_persona":
        return await marcasDe(args);
      case "aplicar_cambios":
        return await aplicarCambios(args);
      case "crear_rol":
        return await crearRol(args);
      case "renombrar_rol":
        return await renombrarRol(args);
      case "eliminar_rol":
        return await eliminarRol(args);
      default:
        return fallo(`No existe la herramienta ${nombre}.`);
    }
  } catch (error) {
    console.error("[agente-roles]", nombre, error);
    return fallo("No pude completar esa consulta o ese cambio.");
  }
}
