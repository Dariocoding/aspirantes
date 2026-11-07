/**
 * Monta el servicio del 7 al 13 de noviembre 2026.
 * No toca las marcas fuera de esa ventana.
 *
 * npx tsx scripts/montar-roles-7-13.ts
 * npx tsx scripts/montar-roles-7-13.ts --apply
 */
import dotenv from "dotenv";
import { Prisma, PrismaClient, type Sexo } from "../src/generated/prisma";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const ANIO = 2026;
const MES = 11;
const DESDE = 7;
const HASTA = 13;
const DIAS = [7, 8, 9, 10, 11, 12, 13];
const SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type Marca = { dia: number; marca: string };

type Persona = {
  id: string;
  nombre: string;
  sexo: Sexo;
  peloton: number | null;
  grado: string;
  cargaPrevia: number;
  cargaNueva: number;
  enRol: Map<string, number>;
  ocupacion: Map<number, { nocturno: boolean }>;
};

type PlanVivo = {
  id: string;
  nombre: string;
  sexo: Sexo | null;
  peloton: number | null;
  nocturno: boolean;
  estacionamiento: boolean;
  oficial: boolean;
  cupos: number;
  marcasCupo: string[];
  prioridad: number;
};

type Hueco = { dia: number; rol: string; cupo: number };

function enVentana(dia: number): boolean {
  return dia >= DESDE && dia <= HASTA;
}

function marcasDe(value: unknown): Marca[] {
  if (!Array.isArray(value)) return [];
  const marcas: Marca[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const dia = Number((item as { dia?: unknown }).dia);
    const marca = String((item as { marca?: unknown }).marca ?? "")
      .trim()
      .toUpperCase();
    if (!Number.isInteger(dia) || dia < 1 || dia > 31 || !marca) continue;
    marcas.push({ dia, marca });
  }
  return marcas.sort((a, b) => a.dia - b.dia);
}

function subdividir(nombre: string): { sexo: Sexo | null; peloton: number | null } {
  const texto = nombre.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  let sexo: Sexo | null = null;
  if (/\bfemenin[oa]\b/.test(texto) || /\bcuartelera\b/.test(texto)) sexo = "FEMENINO";
  else if (/\bmasculin[oa]\b/.test(texto) || /\bcuartelero\b/.test(texto)) sexo = "MASCULINO";

  const peloton =
    texto.match(/(?:del\s+)?(\d+)\s*(?:er|do|ro|to|mo|o|º|°)?\s*peloton/) ??
    texto.match(/\b(\d+)\s*(?:er|do|ro|to|mo)\b(?!\s*turno)/);
  const n = peloton?.[1] ? Number(peloton[1]) : null;
  return { sexo, peloton: n && n >= 1 && n <= 40 ? n : null };
}

function etiquetaDia(dia: number): string {
  const fecha = new Date(ANIO, MES - 1, dia);
  const nombre = SEMANA[fecha.getDay()] ?? "";
  return `${dia} ${nombre}`;
}

function prioridadDe(plan: { sexo: Sexo | null; peloton: number | null; estacionamiento: boolean; oficial: boolean }): number {
  if (plan.oficial) return 90;
  if (plan.sexo && plan.peloton) return 0;
  if (plan.peloton) return 1;
  if (plan.estacionamiento) return 2;
  if (plan.sexo) return 3;
  return 4;
}

function puede(
  persona: Persona,
  plan: PlanVivo,
  dia: number,
): boolean {
  if (plan.sexo && persona.sexo !== plan.sexo) return false;
  if (plan.peloton && persona.peloton !== plan.peloton) return false;
  if (plan.estacionamiento && persona.sexo === "FEMENINO") return false;
  if (persona.ocupacion.has(dia)) return false;
  if (persona.ocupacion.get(dia - 1)?.nocturno) return false;
  if (plan.nocturno && persona.ocupacion.has(dia + 1)) return false;
  return true;
}

function elegir(personas: Persona[], plan: PlanVivo, dia: number): Persona | null {
  const candidatos = personas.filter((persona) => puede(persona, plan, dia));
  candidatos.sort((a, b) => {
    const cargaA = a.cargaPrevia + a.cargaNueva;
    const cargaB = b.cargaPrevia + b.cargaNueva;
    if (cargaA !== cargaB) return cargaA - cargaB;
    const ayerA = a.ocupacion.has(dia - 1) ? 1 : 0;
    const ayerB = b.ocupacion.has(dia - 1) ? 1 : 0;
    if (ayerA !== ayerB) return ayerA - ayerB;
    const rolA = a.enRol.get(plan.id) ?? 0;
    const rolB = b.enRol.get(plan.id) ?? 0;
    if (rolA !== rolB) return rolA - rolB;
    return a.nombre.localeCompare(b.nombre, "es");
  });
  return candidatos[0] ?? null;
}

async function main() {
  const aplicar = process.argv.includes("--apply");

  const aspirantes = await prisma.aspirante.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      sexo: true,
      jerarquia: true,
      peloton: { select: { numero: true } },
    },
  });

  const planesDb = await prisma.planRolServicio.findMany({
    where: { anio: ANIO, mes: MES },
    include: {
      asignaciones: {
        orderBy: { orden: "asc" },
        select: {
          id: true,
          orden: true,
          aspiranteId: true,
          autoridadId: true,
          nombre: true,
          dias: true,
        },
      },
    },
  });

  const personas = new Map<string, Persona>();
  for (const aspirante of aspirantes) {
    personas.set(aspirante.id, {
      id: aspirante.id,
      nombre: `${aspirante.apellidos} ${aspirante.nombres}`.replace(/\s+/g, " ").trim(),
      sexo: aspirante.sexo,
      peloton: aspirante.peloton?.numero ?? null,
      grado: aspirante.jerarquia === "DISTINGUIDO" ? "DIST" : "ASP/OFIC",
      cargaPrevia: 0,
      cargaNueva: 0,
      enRol: new Map(),
      ocupacion: new Map(),
    });
  }

  const planes: PlanVivo[] = planesDb.map((plan) => {
    const sub = subdividir(plan.nombre);
    const estacionamiento = plan.categoria === "ESTACIONAMIENTO" || /estacionamiento/i.test(plan.nombre);
    const oficial = plan.conAutoridad || plan.categoria === "OFICIAL";
    const nocturno = plan.papelNocturno !== "NINGUNO";
    const cupos = estacionamiento ? 3 : 1;
    const base: PlanVivo = {
      id: plan.id,
      nombre: plan.nombre,
      sexo: estacionamiento ? "MASCULINO" : sub.sexo,
      peloton: sub.peloton,
      nocturno,
      estacionamiento,
      oficial,
      cupos,
      marcasCupo: estacionamiento ? ["T1", "T2", "T3"] : ["X"],
      prioridad: 0,
    };
    base.prioridad = prioridadDe(base);
    return base;
  });

  const planPorId = new Map(planes.map((plan) => [plan.id, plan]));

  for (const plan of planesDb) {
    const vivo = planPorId.get(plan.id);
    if (!vivo || vivo.oficial) continue;
    for (const asignacion of plan.asignaciones) {
      if (!asignacion.aspiranteId) continue;
      const persona = personas.get(asignacion.aspiranteId);
      if (!persona) continue;
      for (const marca of marcasDe(asignacion.dias)) {
        if (enVentana(marca.dia)) continue;
        persona.cargaPrevia += 1;
        const previa = persona.ocupacion.get(marca.dia);
        persona.ocupacion.set(marca.dia, {
          nocturno: Boolean(previa?.nocturno || vivo.nocturno),
        });
      }
    }
  }

  const nuevas: Array<{ planId: string; aspiranteId: string; dia: number; marca: string }> = [];
  const huecos: Hueco[] = [];
  const grilla = new Map<number, Array<{ rol: string; marca: string; nombre: string; sexo: string; peloton: number | null }>>();

  for (const dia of DIAS) {
    const ordenados = [...planes].filter((plan) => !plan.oficial).sort((a, b) => {
      if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
      return a.nombre.localeCompare(b.nombre, "es");
    });
    const filas = grilla.get(dia) ?? [];
    grilla.set(dia, filas);

    for (const plan of ordenados) {
      for (let cupo = 0; cupo < plan.cupos; cupo += 1) {
        const persona = elegir([...personas.values()], plan, dia);
        if (!persona) {
          huecos.push({ dia, rol: plan.nombre, cupo });
          continue;
        }
        const marca = plan.marcasCupo[cupo] ?? "X";
        persona.cargaNueva += 1;
        persona.enRol.set(plan.id, (persona.enRol.get(plan.id) ?? 0) + 1);
        persona.ocupacion.set(dia, { nocturno: plan.nocturno });
        nuevas.push({ planId: plan.id, aspiranteId: persona.id, dia, marca });
        filas.push({
          rol: plan.nombre,
          marca,
          nombre: persona.nombre,
          sexo: persona.sexo === "FEMENINO" ? "F" : "M",
          peloton: persona.peloton,
        });
      }
    }
  }

  const oficiales = planesDb.find((plan) => plan.conAutoridad || plan.categoria === "OFICIAL");
  const cicloOficial = (oficiales?.asignaciones ?? [])
    .filter((item) => item.autoridadId)
    .map((item) => ({ id: item.id, nombre: item.nombre, autoridadId: item.autoridadId! }));
  const oficialPorDia = new Map<number, string>();
  if (cicloOficial.length >= 3) {
    const porIndice = new Map<number, string>();
    for (const item of cicloOficial) {
      const dias = marcasDe(
        oficiales?.asignaciones.find((row) => row.id === item.id)?.dias,
      )
        .map((marca) => marca.dia)
        .filter((dia) => !enVentana(dia));
      for (const dia of dias) porIndice.set((dia - 1) % cicloOficial.length, item.id);
    }
    for (const dia of DIAS) {
      const id = porIndice.get((dia - 1) % cicloOficial.length);
      if (id) oficialPorDia.set(dia, id);
    }
  }

  console.log(`Aspirantes ${personas.size}. Marcas nuevas ${nuevas.length}. Huecos ${huecos.length}.`);
  if (huecos.length) {
    for (const hueco of huecos) console.log(`  HUECO ${etiquetaDia(hueco.dia)} ${hueco.rol} cupo ${hueco.cupo + 1}`);
  }

  for (const dia of DIAS) {
    console.log(`\n== ${etiquetaDia(dia)} ==`);
    const oficialId = oficialPorDia.get(dia);
    const oficial = cicloOficial.find((item) => item.id === oficialId);
    if (oficial) console.log(`  OFICIAL DE DIA | ${oficial.nombre}`);
    for (const fila of grilla.get(dia) ?? []) {
      const pel = fila.peloton ? `P${fila.peloton}` : "—";
      console.log(`  ${fila.marca.padEnd(2)} ${fila.sexo}${pel} ${fila.nombre} | ${fila.rol}`);
    }
  }

  const totales = [...personas.values()].sort((a, b) => {
    const diff = a.cargaPrevia + a.cargaNueva - (b.cargaPrevia + b.cargaNueva);
    if (diff !== 0) return diff;
    return a.nombre.localeCompare(b.nombre, "es");
  });
  const hist = new Map<number, number>();
  console.log("\n== CARGA ==");
  for (const persona of totales) {
    const total = persona.cargaPrevia + persona.cargaNueva;
    hist.set(total, (hist.get(total) ?? 0) + 1);
    const pel = persona.peloton ? `P${persona.peloton}` : "SP";
    const sexo = persona.sexo === "FEMENINO" ? "F" : "M";
    console.log(
      `${sexo}${pel} prev=${persona.cargaPrevia} nueva=${persona.cargaNueva} total=${total} ${persona.nombre}`,
    );
  }
  console.log("histograma total", [...hist.entries()].sort((a, b) => a[0] - b[0]));

  const choques = validar(planesDb, planPorId, nuevas, personas);
  if (choques.length) {
    console.log("\nCHOQUES");
    for (const linea of choques) console.log(" ", linea);
  } else {
    console.log("\nSin choques en la ventana ni contra el 6 o el 17.");
  }

  if (!aplicar) {
    console.log("\nDry-run. Pasa --apply para guardar.");
    return;
  }
  if (huecos.length || choques.length) {
    throw new Error("No se guarda: hay huecos o choques.");
  }

  await prisma.$transaction(async (tx) => {
    for (const plan of planesDb) {
      const vivo = planPorId.get(plan.id);
      if (!vivo) continue;

      if (vivo.oficial) {
        for (const asignacion of plan.asignaciones) {
          const previas = marcasDe(asignacion.dias).filter((marca) => !enVentana(marca.dia));
          const agregadas: Marca[] = [];
          for (const dia of DIAS) {
            if (oficialPorDia.get(dia) === asignacion.id) agregadas.push({ dia, marca: "X" });
          }
          await tx.asignacionRolServicio.update({
            where: { id: asignacion.id },
            data: { dias: juntar(previas, agregadas) as Prisma.InputJsonValue },
          });
        }
        continue;
      }

      const porPersona = new Map<string, Marca[]>();
      for (const marca of nuevas.filter((item) => item.planId === plan.id)) {
        const lista = porPersona.get(marca.aspiranteId) ?? [];
        lista.push({ dia: marca.dia, marca: marca.marca });
        porPersona.set(marca.aspiranteId, lista);
      }

      const ya = new Set<string>();
      let orden = plan.asignaciones.reduce((max, item) => Math.max(max, item.orden), 0);

      for (const asignacion of plan.asignaciones) {
        const previas = marcasDe(asignacion.dias).filter((marca) => !enVentana(marca.dia));
        const extra =
          asignacion.aspiranteId && !ya.has(asignacion.aspiranteId)
            ? (porPersona.get(asignacion.aspiranteId) ?? [])
            : [];
        if (asignacion.aspiranteId) ya.add(asignacion.aspiranteId);
        await tx.asignacionRolServicio.update({
          where: { id: asignacion.id },
          data: { dias: juntar(previas, extra) as Prisma.InputJsonValue },
        });
      }

      for (const [aspiranteId, dias] of porPersona) {
        if (ya.has(aspiranteId)) continue;
        const persona = personas.get(aspiranteId);
        if (!persona) continue;
        orden += 1;
        await tx.asignacionRolServicio.create({
          data: {
            planId: plan.id,
            orden,
            grado: persona.grado,
            nombre: persona.nombre,
            aspiranteId,
            dias: juntar([], dias) as Prisma.InputJsonValue,
          },
        });
      }
    }
  }, { timeout: 60000 });

  console.log("\nGuardado.");
}

function juntar(previas: Marca[], extra: Marca[]): Marca[] {
  const porDia = new Map<number, string>();
  for (const marca of previas) porDia.set(marca.dia, marca.marca);
  for (const marca of extra) porDia.set(marca.dia, marca.marca);
  return [...porDia.entries()]
    .map(([dia, marca]) => ({ dia, marca }))
    .sort((a, b) => a.dia - b.dia);
}

function validar(
  planesDb: Array<{
    id: string;
    nombre: string;
    asignaciones: Array<{ aspiranteId: string | null; autoridadId: string | null; nombre: string; dias: unknown }>;
  }>,
  planPorId: Map<string, PlanVivo>,
  nuevas: Array<{ planId: string; aspiranteId: string; dia: number; marca: string }>,
  personas: Map<string, Persona>,
): string[] {
  const porPersonaDia = new Map<string, Array<{ dia: number; rol: string; nocturno: boolean; nueva: boolean }>>();

  for (const plan of planesDb) {
    const vivo = planPorId.get(plan.id);
    if (!vivo || vivo.oficial) continue;
    for (const asignacion of plan.asignaciones) {
      if (!asignacion.aspiranteId) continue;
      for (const marca of marcasDe(asignacion.dias)) {
        if (enVentana(marca.dia)) continue;
        const lista = porPersonaDia.get(asignacion.aspiranteId) ?? [];
        lista.push({ dia: marca.dia, rol: plan.nombre, nocturno: vivo.nocturno, nueva: false });
        porPersonaDia.set(asignacion.aspiranteId, lista);
      }
    }
  }
  for (const marca of nuevas) {
    const vivo = planPorId.get(marca.planId);
    if (!vivo) continue;
    const lista = porPersonaDia.get(marca.aspiranteId) ?? [];
    lista.push({ dia: marca.dia, rol: vivo.nombre, nocturno: vivo.nocturno, nueva: true });
    porPersonaDia.set(marca.aspiranteId, lista);
  }

  const errores: string[] = [];
  for (const marca of nuevas) {
    const vivo = planPorId.get(marca.planId);
    const persona = personas.get(marca.aspiranteId);
    if (vivo?.estacionamiento && persona?.sexo === "FEMENINO") {
      errores.push(`${persona.nombre} en estacionamiento el día ${marca.dia}`);
    }
    if (vivo?.sexo && persona && persona.sexo !== vivo.sexo) {
      errores.push(`${persona.nombre} no corresponde al sexo de ${vivo.nombre}`);
    }
    if (vivo?.peloton && persona && persona.peloton !== vivo.peloton) {
      errores.push(`${persona.nombre} no es del pelotón ${vivo.peloton} (${vivo.nombre})`);
    }
  }

  for (const [id, lista] of porPersonaDia) {
    const persona = personas.get(id);
    const porDia = new Map<number, typeof lista>();
    for (const item of lista) {
      const grupo = porDia.get(item.dia) ?? [];
      grupo.push(item);
      porDia.set(item.dia, grupo);
    }
    for (const [dia, grupo] of porDia) {
      const manana = porDia.get(dia + 1) ?? [];
      const tocaNueva = grupo.some((item) => item.nueva) || manana.some((item) => item.nueva);
      if (!tocaNueva) continue;
      if (grupo.length > 1 && grupo.some((item) => item.nueva)) {
        errores.push(
          `${persona?.nombre ?? id} día ${dia} dos roles: ${grupo.map((item) => item.rol).join(" + ")}`,
        );
      }
      if (grupo.some((item) => item.nocturno) && manana.length > 0) {
        errores.push(
          `${persona?.nombre ?? id} nocturno ${dia} (${grupo.map((item) => item.rol).join(", ")}) choca con ${dia + 1} (${manana.map((item) => item.rol).join(", ")})`,
        );
      }
    }
  }

  return errores;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
