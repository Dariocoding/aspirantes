/**
 * A quien monta medicina o enfermería le deja solo esa secuencia desde el día 7.
 * Los otros puestos se los pasa a quien lleva menos y tiene el día libre.
 *
 * npx tsx scripts/_equidad-med.ts
 * npx tsx scripts/_equidad-med.ts --apply
 */
import dotenv from "dotenv";
import { Prisma, PrismaClient, type Sexo } from "../src/generated/prisma";

dotenv.config({ path: ".env.local" });
const prisma = new PrismaClient();

type Marca = { dia: number; marca: string };
type Ocupacion = { nocturno: boolean; planId: string; marca: string };
type Persona = {
  id: string;
  nombre: string;
  sexo: Sexo;
  peloton: number | null;
  grado: string;
  ocupacion: Map<number, Ocupacion>;
  secuencia: boolean;
};
type PlanVivo = {
  id: string;
  nombre: string;
  sexo: Sexo | null;
  peloton: number | null;
  nocturno: boolean;
  estacionamiento: boolean;
  bloqueado: boolean;
};

function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/\s+/g, " ").trim();
}

function marcasDe(value: unknown): Marca[] {
  if (!Array.isArray(value)) return [];
  const marcas: Marca[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const dia = Number((item as { dia?: unknown }).dia);
    const marca = String((item as { marca?: unknown }).marca ?? "").trim().toUpperCase();
    if (!Number.isInteger(dia) || !marca) continue;
    marcas.push({ dia, marca });
  }
  return marcas;
}

function subdividir(nombre: string): { sexo: Sexo | null; peloton: number | null } {
  const texto = fold(nombre).toLowerCase();
  let sexo: Sexo | null = null;
  if (/\bfemenin[oa]\b/.test(texto) || /\bcuartelera\b/.test(texto)) sexo = "FEMENINO";
  else if (/\bmasculin[oa]\b/.test(texto) || /\bcuartelero\b/.test(texto)) sexo = "MASCULINO";
  const peloton = texto.match(/(?:del\s+)?(\d+)\s*(?:er|do|ro|to|mo|o|º|°)?\s*peloton/);
  const n = peloton?.[1] ? Number(peloton[1]) : null;
  return { sexo, peloton: n && n >= 1 && n <= 40 ? n : null };
}

function veces(persona: Persona, planId: string): number {
  let n = 0;
  for (const item of persona.ocupacion.values()) if (item.planId === planId) n += 1;
  return n;
}

function puede(persona: Persona, plan: PlanVivo, dia: number, excluidos: Set<string>, alfaroId: string): boolean {
  if (persona.secuencia || excluidos.has(persona.id)) return false;
  if (persona.id === alfaroId && plan.estacionamiento) return false;
  if (plan.sexo && persona.sexo !== plan.sexo) return false;
  if (plan.peloton && persona.peloton !== plan.peloton) return false;
  if (plan.estacionamiento && persona.sexo === "FEMENINO") return false;
  if (persona.ocupacion.has(dia)) return false;
  if (persona.ocupacion.get(dia - 1)?.nocturno) return false;
  if (plan.nocturno && persona.ocupacion.has(dia + 1)) return false;
  return true;
}

async function main() {
  const aplicar = process.argv.includes("--apply");
  const aspirantes = await prisma.aspirante.findMany({
    where: { deletedAt: null },
    select: { id: true, nombres: true, apellidos: true, sexo: true, jerarquia: true, peloton: { select: { numero: true } } },
  });
  const personas = new Map<string, Persona>();
  for (const aspirante of aspirantes) {
    personas.set(aspirante.id, {
      id: aspirante.id,
      nombre: `${aspirante.apellidos} ${aspirante.nombres}`.replace(/\s+/g, " ").trim(),
      sexo: aspirante.sexo,
      peloton: aspirante.peloton?.numero ?? null,
      grado: aspirante.jerarquia === "DISTINGUIDO" ? "DIST" : "ASP/OFIC",
      ocupacion: new Map(),
      secuencia: false,
    });
  }
  const buscar = (clave: string) => {
    const hallado = [...personas.values()].find((persona) => fold(persona.nombre).includes(clave));
    if (!hallado) throw new Error(`No está ${clave}`);
    return hallado;
  };
  const excluidos = new Set([buscar("GONZALEZ LAGUNA").id, buscar("NAVAS VICUNA").id, buscar("FLORES MONTESINOS").id]);
  const alfaroId = buscar("ALFARO JESUS").id;

  const planesDb = await prisma.planRolServicio.findMany({
    where: { anio: 2026, mes: 11 },
    include: { asignaciones: true },
  });
  const planes = new Map<string, PlanVivo>();
  for (const plan of planesDb) {
    if (plan.conAutoridad || plan.categoria === "OFICIAL") continue;
    const sub = subdividir(plan.nombre);
    const estacionamiento = plan.categoria === "ESTACIONAMIENTO" || /estacionamiento/i.test(plan.nombre);
    const vivo: PlanVivo = {
      id: plan.id,
      nombre: plan.nombre,
      sexo: estacionamiento ? "MASCULINO" : sub.sexo,
      peloton: sub.peloton,
      nocturno: plan.papelNocturno !== "NINGUNO",
      estacionamiento,
      bloqueado: plan.nombre === "MEDICINA" || plan.nombre === "ENFERMERIA",
    };
    planes.set(plan.id, vivo);
    for (const asignacion of plan.asignaciones) {
      if (!asignacion.aspiranteId) continue;
      const persona = personas.get(asignacion.aspiranteId);
      if (!persona) continue;
      if (vivo.bloqueado) persona.secuencia = true;
      for (const marca of marcasDe(asignacion.dias)) {
        persona.ocupacion.set(marca.dia, { nocturno: vivo.nocturno, planId: plan.id, marca: marca.marca });
      }
    }
  }

  const huecos: Array<{ plan: PlanVivo; dia: number; marca: string; desde: string }> = [];
  for (const persona of personas.values()) {
    if (!persona.secuencia) continue;
    for (const [dia, item] of [...persona.ocupacion.entries()]) {
      const plan = planes.get(item.planId)!;
      if (plan.bloqueado || dia < 7) continue;
      persona.ocupacion.delete(dia);
      huecos.push({ plan, dia, marca: item.marca, desde: persona.nombre });
    }
  }

  const cambios: string[] = [];
  const vacios: string[] = [];
  const recibidos = new Set<string>();
  const distancia = (persona: Persona, dia: number) => {
    let mejor = 99;
    for (const otro of persona.ocupacion.keys()) mejor = Math.min(mejor, Math.abs(otro - dia));
    return mejor;
  };
  huecos.sort((a, b) => a.dia - b.dia || a.plan.nombre.localeCompare(b.plan.nombre, "es"));
  for (const hueco of huecos) {
    const aptos = [...personas.values()].filter(
      (persona) => !recibidos.has(persona.id) && persona.ocupacion.size < 6 && puede(persona, hueco.plan, hueco.dia, excluidos, alfaroId),
    );
    const frescos = aptos.filter((persona) => veces(persona, hueco.plan.id) === 0);
    const base = frescos.length > 0 ? frescos : aptos;
    const holgados = base.filter((persona) => distancia(persona, hueco.dia) >= 3);
    const candidatos = holgados.length > 0 ? holgados : base.filter((persona) => distancia(persona, hueco.dia) >= 2);
    const pool = candidatos.length > 0 ? candidatos : base;
    pool.sort((a, b) => distancia(b, hueco.dia) - distancia(a, hueco.dia) || a.ocupacion.size - b.ocupacion.size || a.nombre.localeCompare(b.nombre, "es"));
    const elegido = pool[0];
    if (elegido) recibidos.add(elegido.id);
    if (!elegido) {
      vacios.push(`${hueco.dia} ${hueco.plan.nombre}`);
      continue;
    }
    elegido.ocupacion.set(hueco.dia, { nocturno: hueco.plan.nocturno, planId: hueco.plan.id, marca: hueco.marca });
    cambios.push(`${hueco.dia} ${hueco.marca} ${hueco.plan.nombre}: ${hueco.desde} -> ${elegido.nombre}`);
  }

  console.log("CAMBIOS", cambios.length, "VACIOS", vacios.length);
  for (const linea of cambios) console.log(linea);
  for (const linea of vacios) console.log("VACIO", linea);

  console.log("\n== SECUENCIA == ");
  for (const persona of [...personas.values()].filter((item) => item.secuencia).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))) {
    const dias = [...persona.ocupacion.entries()].sort((a, b) => a[0] - b[0]);
    console.log(
      `${dias.length} ${persona.nombre}: ${dias.map(([dia, item]) => `${dia} ${planes.get(item.planId)!.nombre}`).join(" | ")}`,
    );
  }

  const choques: string[] = [];
  for (const linea of cambios) {
    const nombre = linea.split(" -> ")[1]!;
    const dia = Number(linea.slice(0, 2));
    const persona = [...personas.values()].find((item) => item.nombre === nombre);
    const item = persona?.ocupacion.get(dia);
    if (item?.nocturno && persona?.ocupacion.has(dia + 1)) choques.push(`${nombre} noche ${dia}`);
  }
  console.log("CHOQUES", choques.length);
  for (const linea of choques) console.log(linea);
  if (!aplicar || vacios.length || choques.length) return;

  const tocados = new Set<string>();
  for (const linea of cambios) {
    tocados.add(linea.split(": ")[1]!.split(" -> ")[0]!);
    tocados.add(linea.split(" -> ")[1]!);
  }
  await prisma.$transaction(async (tx) => {
    for (const plan of planesDb) {
      const vivo = planes.get(plan.id);
      if (!vivo || vivo.bloqueado) continue;
      const ya = new Set<string>();
      let orden = plan.asignaciones.reduce((max, item) => Math.max(max, item.orden), 0);
      for (const asignacion of plan.asignaciones) {
        const persona = asignacion.aspiranteId ? personas.get(asignacion.aspiranteId) : undefined;
        if (asignacion.aspiranteId) ya.add(asignacion.aspiranteId);
        if (!persona || !tocados.has(persona.nombre)) continue;
        const dias: Marca[] = [];
        for (const [dia, item] of persona.ocupacion) {
          if (item.planId === plan.id) dias.push({ dia, marca: item.marca });
        }
        dias.sort((a, b) => a.dia - b.dia);
        if (dias.length === 0) {
          await tx.asignacionRolServicio.delete({ where: { id: asignacion.id } });
          continue;
        }
        await tx.asignacionRolServicio.update({
          where: { id: asignacion.id },
          data: { dias: dias as Prisma.InputJsonValue },
        });
      }
      for (const persona of personas.values()) {
        if (!tocados.has(persona.nombre) || ya.has(persona.id)) continue;
        const dias: Marca[] = [];
        for (const [dia, item] of persona.ocupacion) {
          if (item.planId === plan.id) dias.push({ dia, marca: item.marca });
        }
        if (dias.length === 0) continue;
        orden += 1;
        await tx.asignacionRolServicio.create({
          data: {
            planId: plan.id,
            orden,
            grado: persona.grado,
            nombre: persona.nombre,
            aspiranteId: persona.id,
            dias: dias.sort((a, b) => a.dia - b.dia) as Prisma.InputJsonValue,
          },
        });
      }
    }
  }, { timeout: 60000 });
  console.log("Guardado.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
