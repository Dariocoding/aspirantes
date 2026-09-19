/**
 * Homologa estaturaCm a metros (180 / 1,6 → 1.80 / 1.60).
 * Ejecutar: .\node_modules\.bin\tsx.CMD prisma/normalize-estatura.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { homologarEstaturaCm } from "../src/lib/aspirantes/medidas";

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
      estaturaCm: true,
      aspirante: { select: { cedula: true } },
    },
  });

  const before = new Map<string, number>();
  for (const r of rows) {
    const key = r.estaturaCm == null ? "null" : String(r.estaturaCm);
    before.set(key, (before.get(key) ?? 0) + 1);
  }
  console.log("Antes:");
  for (const [k, n] of [...before.entries()].sort((a, b) => {
    const na = Number(a[0]);
    const nb = Number(b[0]);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a[0].localeCompare(b[0]);
  })) {
    console.log(`  ${n}\t${k}`);
  }

  let updated = 0;
  let skipped = 0;
  const unparsed: string[] = [];

  for (const r of rows) {
    if (r.estaturaCm == null) {
      skipped += 1;
      continue;
    }
    const next = homologarEstaturaCm(r.estaturaCm);
    if (next == null) {
      unparsed.push(`${r.aspirante.cedula}: ${r.estaturaCm}`);
      skipped += 1;
      continue;
    }
    if (Math.abs(next - r.estaturaCm) < 0.0005) {
      skipped += 1;
      continue;
    }
    await prisma.datosFisicosMedicos.update({
      where: { id: r.id },
      data: { estaturaCm: next },
    });
    updated += 1;
  }

  const afterRows = await prisma.datosFisicosMedicos.findMany({
    select: { estaturaCm: true },
  });
  const after = new Map<string, number>();
  for (const r of afterRows) {
    const key = r.estaturaCm == null ? "—" : String(r.estaturaCm);
    after.set(key, (after.get(key) ?? 0) + 1);
  }
  console.log(`\nActualizados: ${updated} · sin cambio: ${skipped} · total: ${rows.length}`);
  console.log("Después:");
  for (const [k, n] of [...after.entries()].sort((a, b) => {
    const na = Number(a[0]);
    const nb = Number(b[0]);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a[0].localeCompare(b[0]);
  })) {
    console.log(`  ${n}\t${k}`);
  }
  if (unparsed.length) {
    console.log("\nNo se pudo interpretar:");
    for (const u of unparsed) console.log(`  ${u}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
