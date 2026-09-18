/**
 * Homologa tipoSangre + factorRh: grupo A/B/AB/O y RH POSITIVO/NEGATIVO.
 * Si hay grupo y falta el factor, se asume positivo.
 * Ejecutar: .\node_modules\.bin\tsx.CMD prisma/normalize-tipo-sangre.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { homologarDatosSangre } from "../src/lib/aspirantes/senaletica";

function loadEnvLocal() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.datosFisicosMedicos.findMany({
    select: {
      id: true,
      tipoSangre: true,
      factorRh: true,
      aspirante: { select: { cedula: true } },
    },
  });

  const before = new Map<string, number>();
  for (const r of rows) {
    const key = `${JSON.stringify(r.tipoSangre)} | ${r.factorRh ?? "null"}`;
    before.set(key, (before.get(key) ?? 0) + 1);
  }
  console.log("Antes:");
  for (const [k, n] of [...before.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}\t${k}`);
  }

  let updated = 0;
  let skipped = 0;
  const unparsed: string[] = [];

  for (const r of rows) {
    const next = homologarDatosSangre(r.tipoSangre, r.factorRh);
    const sameGrupo = (r.tipoSangre ?? null) === (next.tipoSangre ?? null);
    const sameRh = (r.factorRh ?? null) === (next.factorRh ?? null);
    if (sameGrupo && sameRh) {
      skipped += 1;
      continue;
    }
    if (r.tipoSangre?.trim() && !next.tipoSangre) {
      unparsed.push(`${r.aspirante.cedula}: ${JSON.stringify(r.tipoSangre)}`);
    }
    await prisma.datosFisicosMedicos.update({
      where: { id: r.id },
      data: {
        tipoSangre: next.tipoSangre,
        factorRh: next.factorRh,
      },
    });
    updated += 1;
  }

  const afterRows = await prisma.datosFisicosMedicos.findMany({
    select: { tipoSangre: true, factorRh: true },
  });
  const after = new Map<string, number>();
  for (const r of afterRows) {
    const key = `${r.tipoSangre ?? "—"} ${r.factorRh === "NEGATIVO" ? "-" : r.factorRh === "POSITIVO" ? "+" : ""}`.trim();
    after.set(key, (after.get(key) ?? 0) + 1);
  }
  console.log(`\nActualizados: ${updated} · sin cambio: ${skipped} · total: ${rows.length}`);
  console.log("Después:");
  for (const [k, n] of [...after.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}\t${k}`);
  }
  if (unparsed.length) {
    console.log("\nNo se pudo interpretar (se dejó vacío el grupo):");
    for (const u of unparsed) console.log(`  ${u}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
