/**
 * Oficiales del cuadro vinculables a roles de servicio.
 * Ejecutar: pnpm exec tsx prisma/seed-autoridades.ts
 */
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma";
import { revincularRolesServicioMesDb } from "../src/lib/roles-servicio/revincular-db";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

const OFICIALES = [
  { nombres: "EDWING", apellidos: "SANABRIA", jerarquia: "PRIMER_TENIENTE" as const },
  { nombres: "LEANDRO", apellidos: "CONTRERAS", jerarquia: "PRIMER_TENIENTE" as const },
  { nombres: "OSWALDO", apellidos: "MORILLO", jerarquia: "PRIMER_TENIENTE" as const },
];

async function main() {
  for (const oficial of OFICIALES) {
    const existente = await prisma.autoridad.findFirst({
      where: {
        nombres: { equals: oficial.nombres, mode: "insensitive" },
        apellidos: { equals: oficial.apellidos, mode: "insensitive" },
      },
    });
    if (existente) {
      await prisma.autoridad.update({
        where: { id: existente.id },
        data: { jerarquia: oficial.jerarquia, activa: true },
      });
      console.log(`Actualizada: ${oficial.nombres} ${oficial.apellidos}`);
    } else {
      await prisma.autoridad.create({ data: { ...oficial, activa: true } });
      console.log(`Creada: ${oficial.nombres} ${oficial.apellidos}`);
    }
  }

  const { actualizadas } = await revincularRolesServicioMesDb(prisma);
  console.log(`Re-vinculadas ${actualizadas} asignaciones del mes vigente.`);
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
