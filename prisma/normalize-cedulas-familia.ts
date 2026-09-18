/**
 * Normaliza cédulas de madre/padre: solo dígitos, 6–12.
 * Ejecutar: .\node_modules\.bin\tsx.CMD prisma/normalize-cedulas-familia.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "../src/generated/prisma";

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

function normalize(raw: string | null): { next: string | null; changed: boolean; invalid: boolean } {
  if (raw == null || raw.trim() === "") return { next: null, changed: false, invalid: false };
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { next: null, changed: true, invalid: true };
  if (digits.length < 6 || digits.length > 12) {
    return { next: null, changed: true, invalid: true };
  }
  return { next: digits, changed: raw !== digits, invalid: false };
}

async function main() {
  const rows = await prisma.aspirante.findMany({
    select: { id: true, cedula: true, madreCedula: true, padreCedula: true },
  });
  let updated = 0;
  const bad: string[] = [];
  for (const a of rows) {
    const madre = normalize(a.madreCedula);
    const padre = normalize(a.padreCedula);
    if (madre.invalid) bad.push(`${a.cedula} madre ${JSON.stringify(a.madreCedula)} → ${madre.next}`);
    if (padre.invalid) bad.push(`${a.cedula} padre ${JSON.stringify(a.padreCedula)} → ${padre.next}`);
    if (!madre.changed && !padre.changed) continue;
    await prisma.aspirante.update({
      where: { id: a.id },
      data: {
        ...(madre.changed ? { madreCedula: madre.next } : {}),
        ...(padre.changed ? { padreCedula: padre.next } : {}),
      },
    });
    updated += 1;
    console.log(
      `${a.cedula}: madre ${JSON.stringify(a.madreCedula)}→${JSON.stringify(madre.next)} | padre ${JSON.stringify(a.padreCedula)}→${JSON.stringify(padre.next)}`,
    );
  }
  console.log(`Actualizados: ${updated} / ${rows.length}`);
  if (bad.length) {
    console.log("Siguen fuera de 6–12 dígitos:");
    for (const b of bad) console.log(`  ${b}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
