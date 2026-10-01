import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.aspirante.findMany({
    select: {
      nombres: true,
      apellidos: true,
      sexo: true,
      deletedAt: true,
      convocatoria: { select: { codigo: true, activa: true } },
    },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
  });
  console.log("COUNT", rows.length);
  for (const r of rows) {
    console.log(
      [
        r.deletedAt ? "DEL" : "OK",
        r.sexo,
        r.convocatoria.codigo,
        r.convocatoria.activa ? "ACT" : "off",
        `${r.apellidos} | ${r.nombres}`,
      ].join("\t"),
    );
  }
}

main()
  .finally(() => prisma.$disconnect());
