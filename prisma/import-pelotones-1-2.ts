/**
 * Asigna pelotón 1/2 SOLO por cédula exacta.
 * - No crea aspirantes
 * - No modifica nombres, cédula, sexo ni nada más
 * - Solo actualiza `pelotonId` cuando la cédula existe
 *
 * Ejecutar:
 *   .\node_modules\.bin\tsx.CMD prisma/import-pelotones-1-2.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { PrismaClient } from "../src/generated/prisma";
import { syncPelotonesConvocatoria } from "../src/lib/pelotones";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
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

const EXCEL_PATH =
  process.env.PELOTONES_XLSX ??
  "c:\\Users\\javie\\Desktop\\CEFOA PELOTON 1 Y 2 NUEVO.xlsx";

function cellText(v: ExcelJS.CellValue): unknown {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object" && "text" in v) return (v as { text: string }).text;
  if (typeof v === "object" && "result" in v) return (v as { result: unknown }).result;
  if (typeof v === "object" && "richText" in v) {
    return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
  }
  return v;
}

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return String(Math.trunc(v));
  return String(v).trim();
}

type ExcelRow = { peloton: 1 | 2; cedula: string };

async function parseExcelCedulas(path: string): Promise<ExcelRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Hoja2") ?? wb.worksheets[0];
  if (!ws) throw new Error("No se encontró Hoja2 en el Excel.");

  const out: ExcelRow[] = [];
  let mode: 1 | 2 | null = null;

  ws.eachRow({ includeEmpty: false }, (row) => {
    const joined = [2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((c) => asText(cellText(row.getCell(c).value)))
      .filter(Boolean)
      .join(" ")
      .toUpperCase();

    if (joined.includes("LISTA DEL PRIMER PELOTON")) {
      mode = 1;
      return;
    }
    if (joined.includes("LISTA DEL SEGUNDO PELOTON")) {
      mode = 2;
      return;
    }
    if (joined.includes("COMANDANTE DEL")) {
      mode = null;
      return;
    }
    if (!mode) return;

    const num = cellText(row.getCell(3).value);
    const jq = asText(cellText(row.getCell(4).value));
    const cedRaw = cellText(row.getCell(9).value);
    if (typeof num !== "number" && !/^\d+$/.test(asText(num))) return;
    if (!jq || cedRaw == null) return;
    const cedula = onlyDigits(asText(cedRaw));
    if (cedula.length < 6 || cedula.length > 12) return;
    out.push({ peloton: mode, cedula });
  });

  const map = new Map<string, ExcelRow>();
  for (const r of out) map.set(r.cedula, r);
  return [...map.values()];
}

async function main() {
  const rows = await parseExcelCedulas(EXCEL_PATH);
  console.log(
    `Excel: ${rows.length} cédulas (P1=${rows.filter((r) => r.peloton === 1).length}, P2=${rows.filter((r) => r.peloton === 2).length}).`,
  );

  const convocatoria =
    (await prisma.convocatoria.findFirst({ where: { activa: true } })) ??
    (await prisma.convocatoria.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!convocatoria) throw new Error("No hay convocatoria en la BD.");

  const existingCount = await prisma.peloton.count({
    where: { convocatoriaId: convocatoria.id },
  });
  const sync = await syncPelotonesConvocatoria(
    prisma,
    convocatoria.id,
    Math.max(2, existingCount),
  );
  if (!sync.ok) throw new Error(sync.error);

  const pelotones = await prisma.peloton.findMany({
    where: { convocatoriaId: convocatoria.id, numero: { in: [1, 2] } },
  });
  const pMap = new Map(pelotones.map((p) => [p.numero, p.id]));
  if (!pMap.has(1) || !pMap.has(2)) throw new Error("Faltan pelotones 1/2");

  // Limpiar solo P1/P2 de esta convocatoria; luego reasignar por cédula exacta
  await prisma.aspirante.updateMany({
    where: {
      convocatoriaId: convocatoria.id,
      pelotonId: { in: [pMap.get(1)!, pMap.get(2)!] },
    },
    data: { pelotonId: null },
  });

  let updated = 0;
  const noMatch: string[] = [];

  for (const row of rows) {
    const result = await prisma.aspirante.updateMany({
      where: { convocatoriaId: convocatoria.id, cedula: row.cedula },
      data: { pelotonId: pMap.get(row.peloton)! },
    });
    if (result.count === 0) {
      noMatch.push(`${row.cedula} (P${row.peloton})`);
      continue;
    }
    updated += result.count;
  }

  const c1 = await prisma.aspirante.count({
    where: { convocatoriaId: convocatoria.id, pelotonId: pMap.get(1)! },
  });
  const c2 = await prisma.aspirante.count({
    where: { convocatoriaId: convocatoria.id, pelotonId: pMap.get(2)! },
  });

  console.log(`Actualizados (solo pelotón): ${updated}.`);
  console.log(`  Pelotón 1: ${c1}`);
  console.log(`  Pelotón 2: ${c2}`);
  if (noMatch.length) {
    console.log(`Sin match por cédula (omitidos, no se creó nada): ${noMatch.length}`);
    for (const c of noMatch) console.log(`  - ${c}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
