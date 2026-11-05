/**
 * Sincroniza noviembre desde el Excel del escritorio, solo pestañas hasta CUARTEL. 2DOP.
 * No borra otros meses ni planes sellados.
 *
 * npx tsx prisma/sync-roles-noviembre.ts --dry-run
 * npx tsx prisma/sync-roles-noviembre.ts
 */
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Prisma, PrismaClient } from "../src/generated/prisma";
import {
  inferirCategoria,
  inferirConAutoridad,
  inferirPapelNocturno,
} from "../src/lib/roles-servicio/catalogo-rol";
import { parsearRolesExcel } from "../src/lib/roles-servicio/parse-excel";
import { vincularPersonaRol } from "../src/lib/roles-servicio/vincular";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

const RUTA_POR_DEFECTO = "C:/Users/javie/Desktop/ROLES DE SERVICIO NOVIEMBRE.xlsx";
const HASTA_HOJA = "CUARTEL. 2DOP";

function rutaExcel(): string {
  return process.argv.find((item) => item.toLowerCase().endsWith(".xlsx")) ?? RUTA_POR_DEFECTO;
}

function normalizarNombreHoja(nombre: string): string {
  return nombre.replace(/\s+/g, " ").trim().toUpperCase();
}

/** Copia el Excel dejando solo hojas desde el inicio hasta CUARTEL. 2DOP inclusive. */
async function excelHastaCuartel2do(rutaOrigen: string): Promise<{ ruta: string; limpiar: () => Promise<void> }> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(rutaOrigen);

  const nombres = libro.worksheets.map((h) => h.name);
  const idx = nombres.findIndex((n) => normalizarNombreHoja(n) === normalizarNombreHoja(HASTA_HOJA));
  if (idx < 0) {
    throw new Error(`No está la pestaña "${HASTA_HOJA}". Hojas: ${nombres.join(" | ")}`);
  }

  const quitar = nombres.slice(idx + 1);
  for (const nombre of quitar) {
    libro.removeWorksheet(nombre);
  }

  const dir = await mkdtemp(join(tmpdir(), "roles-nov-"));
  const ruta = join(dir, "roles-hasta-cuartel-2dop.xlsx");
  const buffer = Buffer.from(await libro.xlsx.writeBuffer());
  await writeFile(ruta, buffer);

  console.log(`Hojas incluidas (${idx + 1}): ${nombres.slice(0, idx + 1).join(" | ")}`);
  if (quitar.length) console.log(`Omitidas: ${quitar.join(" | ")}`);

  return {
    ruta,
    limpiar: async () => {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const origen = rutaExcel();
  const { ruta, limpiar } = await excelHastaCuartel2do(origen);

  try {
    const libro = await parsearRolesExcel(ruta);
    const aspirantes = await prisma.aspirante.findMany({
      where: { deletedAt: null },
      select: { id: true, nombres: true, apellidos: true, cedula: true },
    });
    const porId = new Map(aspirantes.map((a) => [a.id, a]));
    const autoridades = await prisma.autoridad.findMany({
      where: { activa: true },
      select: { id: true, nombres: true, apellidos: true, cedula: true },
    });
    const porAutoridad = new Map(autoridades.map((a) => [a.id, a]));

    let vinculadosAspirante = 0;
    let vinculadosAutoridad = 0;
    let sinCoincidencia = 0;
    let sinNombre = 0;

    console.log(
      `Mes ${libro.mes}/${libro.anio}. Roles: ${libro.roles.length}. Aspirantes: ${aspirantes.length}. Autoridades: ${autoridades.length}.`,
    );

    const sellados = await prisma.planRolServicio.count({
      where: { anio: libro.anio, mes: libro.mes, sellado: true },
    });
    if (sellados > 0) {
      throw new Error(
        `Hay ${sellados} planes sellados en ${libro.mes}/${libro.anio}. No se reescribe un mes cerrado.`,
      );
    }

    if (!dryRun) {
      const planesMes = await prisma.planRolServicio.findMany({
        where: { anio: libro.anio, mes: libro.mes },
        select: { id: true },
      });
      const ids = planesMes.map((p) => p.id);
      if (ids.length) {
        const borradas = await prisma.asignacionRolServicio.deleteMany({
          where: { planId: { in: ids } },
        });
        const planesBorrados = await prisma.planRolServicio.deleteMany({
          where: { anio: libro.anio, mes: libro.mes },
        });
        console.log(
          `Noviembre anterior: ${planesBorrados.count} planes y ${borradas.count} asignaciones borrados.`,
        );
      }
    }

    for (const rol of libro.roles) {
      console.log(`\n${rol.curso} — ${rol.nombre} (${rol.personas.length})`);
      const filas: Prisma.AsignacionRolServicioCreateManyInput[] = [];

      for (const persona of rol.personas) {
        if (!persona.nombre.trim()) {
          sinNombre += 1;
          console.log(`  #${persona.orden} sin nombre, ${persona.dias.length} días`);
          filas.push({
            planId: "",
            orden: persona.orden,
            grado: persona.grado,
            nombre: "",
            dias: persona.dias,
          });
          continue;
        }

        const vinculo = vincularPersonaRol(persona.nombre, persona.grado, aspirantes, autoridades);
        if (vinculo.aspiranteId) {
          vinculadosAspirante += 1;
          const personaCenso = porId.get(vinculo.aspiranteId);
          console.log(
            `  ${persona.nombre} -> ${personaCenso?.nombres} ${personaCenso?.apellidos} (${personaCenso?.cedula})`,
          );
        } else if (vinculo.autoridadId) {
          vinculadosAutoridad += 1;
          const autoridad = porAutoridad.get(vinculo.autoridadId);
          console.log(
            `  ${persona.nombre} -> [Autoridad] ${autoridad?.nombres} ${autoridad?.apellidos}`,
          );
        } else {
          sinCoincidencia += 1;
          console.log(`  SIN COINCIDENCIA ${persona.grado} ${persona.nombre}`);
        }

        const diasServicio = persona.dias.filter((d) => {
          const m = d.marca.trim().toUpperCase();
          return m && m !== "PERMISO" && !/^PER[IÍ]ODO\s+DE\s+CAMPO/.test(m);
        });
        const omitidas = persona.dias.length - diasServicio.length;
        if (omitidas > 0) {
          console.log(
            `    (omitidas ${omitidas} marcas no-servicio: ${persona.dias
              .filter((d) => !diasServicio.includes(d))
              .map((d) => `${d.dia}:${d.marca}`)
              .join(", ")})`,
          );
        }

        filas.push({
          planId: "",
          orden: persona.orden,
          grado: persona.grado,
          nombre: persona.nombre,
          aspiranteId: vinculo.aspiranteId,
          autoridadId: vinculo.autoridadId,
          dias: diasServicio,
        });
      }

      if (dryRun) continue;

      const ahora = new Date();
      const tieneAutoridad = filas.some((fila) => Boolean(fila.autoridadId));
      const registro = await prisma.rolServicio.upsert({
        where: { clave: rol.clave },
        create: {
          clave: rol.clave,
          nombre: rol.nombre,
          curso: rol.curso,
          sortOrder: rol.sortOrder,
          categoria: inferirCategoria(rol.nombre),
          conAutoridad: inferirConAutoridad(rol.nombre, tieneAutoridad),
          papelNocturno: inferirPapelNocturno(rol.nombre),
        },
        update: {
          nombre: rol.nombre,
          curso: rol.curso,
          sortOrder: rol.sortOrder,
          activo: true,
          categoria: inferirCategoria(rol.nombre),
          conAutoridad: inferirConAutoridad(rol.nombre, tieneAutoridad),
          papelNocturno: inferirPapelNocturno(rol.nombre),
        },
      });
      const plan = await prisma.planRolServicio.upsert({
        where: {
          rolServicioId_anio_mes: {
            rolServicioId: registro.id,
            anio: libro.anio,
            mes: libro.mes,
          },
        },
        create: {
          rolServicioId: registro.id,
          anio: libro.anio,
          mes: libro.mes,
          nombre: rol.nombre,
          categoria: inferirCategoria(rol.nombre),
          conAutoridad: inferirConAutoridad(rol.nombre, tieneAutoridad),
          papelNocturno: inferirPapelNocturno(rol.nombre),
        },
        update: {
          nombre: rol.nombre,
          categoria: inferirCategoria(rol.nombre),
          conAutoridad: inferirConAutoridad(rol.nombre, tieneAutoridad),
          papelNocturno: inferirPapelNocturno(rol.nombre),
        },
      });
      await prisma.asignacionRolServicio.deleteMany({ where: { planId: plan.id } });
      if (filas.length > 0) {
        await prisma.asignacionRolServicio.createMany({
          data: filas.map((fila) => ({
            planId: plan.id,
            orden: fila.orden,
            grado: fila.grado,
            nombre: fila.nombre,
            aspiranteId: fila.aspiranteId,
            autoridadId: fila.autoridadId,
            dias: fila.dias as Prisma.InputJsonValue,
            createdAt: ahora,
            updatedAt: ahora,
          })),
        });
      }
    }

    console.log(
      `\nAspirantes: ${vinculadosAspirante}. Autoridades: ${vinculadosAutoridad}. Sin coincidencia: ${sinCoincidencia}. Sin nombre: ${sinNombre}.`,
    );
    if (dryRun) console.log("Vista previa: no se escribió nada.");
    else console.log(`Sincronizado ${libro.mes}/${libro.anio} hasta ${HASTA_HOJA}.`);
  } finally {
    await limpiar();
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
