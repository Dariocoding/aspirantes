/**
 * Carga los roles de servicio desde el Excel mensual y los vincula
 * con aspirantes del censo cuando el nombre coincide sin ambigüedad.
 *
 * Ejecutar: pnpm exec tsx prisma/seed-roles-servicio.ts
 * Vista previa: pnpm exec tsx prisma/seed-roles-servicio.ts --dry-run
 */
import dotenv from "dotenv";
import { Prisma, PrismaClient } from "../src/generated/prisma";
import { coincidenciaRol } from "../src/lib/roles-servicio/match";
import { parsearRolesExcel } from "../src/lib/roles-servicio/parse-excel";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

const RUTA_POR_DEFECTO = "C:/Users/javie/Desktop/ROLES DE SERVICIO 2026.xlsx";

function rutaExcel(): string {
  const argumento = process.argv.find((item) => item.toLowerCase().endsWith(".xlsx"));
  return argumento ?? RUTA_POR_DEFECTO;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const libro = await parsearRolesExcel(rutaExcel());
  const aspirantes = await prisma.aspirante.findMany({
    where: { deletedAt: null },
    select: { id: true, nombres: true, apellidos: true, cedula: true },
  });
  const porId = new Map(aspirantes.map((aspirante) => [aspirante.id, aspirante]));

  let vinculados = 0;
  let ambiguos = 0;
  let sinCoincidencia = 0;
  let sinNombre = 0;

  console.log(`Mes ${libro.mes}/${libro.anio}. Roles: ${libro.roles.length}. Aspirantes en censo: ${aspirantes.length}.`);

  if (!dryRun) {
    const borradas = await prisma.asignacionRolServicio.deleteMany({});
    const planesBorrados = await prisma.planRolServicio.deleteMany({});
    const rolesBorrados = await prisma.rolServicio.deleteMany({});
    console.log(
      `Datos anteriores borrados: ${rolesBorrados.count} roles, ${planesBorrados.count} planes, ${borradas.count} asignaciones.`,
    );
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

      const coincidencia = coincidenciaRol(persona.nombre, aspirantes);
      let aspiranteId: string | null = null;
      if (coincidencia.status === "vinculado") {
        aspiranteId = coincidencia.aspiranteId;
        vinculados += 1;
        const personaCenso = porId.get(aspiranteId);
        console.log(
          `  ${persona.nombre} -> ${personaCenso?.nombres} ${personaCenso?.apellidos} (${personaCenso?.cedula})`,
        );
      } else if (coincidencia.status === "ambiguo") {
        ambiguos += 1;
        const nombres = coincidencia.aspiranteIds
          .map((id) => porId.get(id))
          .filter((item) => item != null)
          .map((item) => `${item.nombres} ${item.apellidos}`)
          .join(" | ");
        console.log(`  AMBIGUO ${persona.nombre} -> ${nombres}`);
      } else {
        sinCoincidencia += 1;
        console.log(`  SIN COINCIDENCIA ${persona.grado} ${persona.nombre}`);
      }

      filas.push({
        planId: "",
        orden: persona.orden,
        grado: persona.grado,
        nombre: persona.nombre,
        aspiranteId,
        dias: persona.dias,
      });
    }

    if (dryRun) continue;

    const ahora = new Date();
    const registro = await prisma.rolServicio.upsert({
      where: { clave: rol.clave },
      create: {
        clave: rol.clave,
        nombre: rol.nombre,
        curso: rol.curso,
        sortOrder: rol.sortOrder,
      },
      update: {
        nombre: rol.nombre,
        curso: rol.curso,
        sortOrder: rol.sortOrder,
        activo: true,
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
      },
      update: {},
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
          dias: fila.dias as Prisma.InputJsonValue,
          createdAt: ahora,
          updatedAt: ahora,
        })),
      });
    }
  }

  console.log(
    `\nVinculados: ${vinculados}. Ambiguos: ${ambiguos}. Sin coincidencia: ${sinCoincidencia}. Sin nombre: ${sinNombre}.`,
  );
  if (dryRun) console.log("Vista previa: no se escribió nada.");
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
