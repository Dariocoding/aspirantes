/**
 * Asigna aspirantes a Pelotón 1 y 2 según «CEFOA PELOTON 1 Y 2 NUEVO.xlsx» (Hoja2).
 *
 * Ejecutar:
 *   .\node_modules\.bin\tsx.CMD prisma/import-pelotones-1-2.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { CalificacionAdmision, PrismaClient, Sexo } from "../src/generated/prisma";
import { nombrePelotonPorDefecto, syncPelotonesConvocatoria } from "../src/lib/pelotones";

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

const DEFAULT_EDAD = 25;

function defaultFechaNacimiento(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setFullYear(d.getFullYear() - DEFAULT_EDAD);
  return d;
}

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

type Parsed = {
  peloton: 1 | 2;
  apellidos: string;
  nombres: string;
  cedula: string;
  sexo: Sexo;
};

async function parseExcel(path: string): Promise<Parsed[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Hoja2") ?? wb.worksheets[0];
  if (!ws) throw new Error("No se encontró Hoja2 en el Excel.");

  const out: Parsed[] = [];
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
    const apellidos = asText(cellText(row.getCell(5).value));
    const nombres = asText(cellText(row.getCell(7).value));
    const cedRaw = cellText(row.getCell(9).value);
    const sexoRaw = asText(cellText(row.getCell(10).value)).toUpperCase();

    if (typeof num !== "number" && !/^\d+$/.test(asText(num))) return;
    if (!jq || !apellidos || !nombres || cedRaw == null) return;

    const cedula = onlyDigits(asText(cedRaw));
    if (cedula.length < 6 || cedula.length > 12) return;

    const sexo = sexoRaw.startsWith("F") ? Sexo.FEMENINO : Sexo.MASCULINO;
    out.push({ peloton: mode, apellidos, nombres, cedula, sexo });
  });

  return out;
}

async function main() {
  const rows = await parseExcel(EXCEL_PATH);
  const p1 = rows.filter((r) => r.peloton === 1);
  const p2 = rows.filter((r) => r.peloton === 2);
  console.log(`Excel: ${rows.length} filas (P1=${p1.length}, P2=${p2.length}).`);

  const seen = new Set<string>();
  const unique: Parsed[] = [];
  for (const r of rows) {
    if (seen.has(r.cedula)) {
      console.warn(`Cédula duplicada en Excel, se usa la última: ${r.cedula}`);
      const idx = unique.findIndex((u) => u.cedula === r.cedula);
      if (idx >= 0) unique[idx] = r;
      continue;
    }
    seen.add(r.cedula);
    unique.push(r);
  }

  const convocatoria =
    (await prisma.convocatoria.findFirst({ where: { activa: true } })) ??
    (await prisma.convocatoria.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!convocatoria) {
    throw new Error("No hay convocatoria en la BD.");
  }

  const existingCount = await prisma.peloton.count({
    where: { convocatoriaId: convocatoria.id },
  });
  const target = Math.max(2, existingCount);
  const sync = await syncPelotonesConvocatoria(prisma, convocatoria.id, target);
  if (!sync.ok) throw new Error(sync.error);

  const pelotones = await prisma.peloton.findMany({
    where: { convocatoriaId: convocatoria.id, numero: { in: [1, 2] } },
    orderBy: { numero: "asc" },
  });
  const pMap = new Map(pelotones.map((p) => [p.numero, p]));
  if (!pMap.has(1) || !pMap.has(2)) {
    throw new Error("No se pudieron crear Pelotón 1 y 2.");
  }

  let updated = 0;
  let created = 0;
  let missingBeforeCreate = 0;
  const notMatched: string[] = [];

  for (const row of unique) {
    const peloton = pMap.get(row.peloton)!;
    const existing = await prisma.aspirante.findFirst({
      where: { cedula: row.cedula, convocatoriaId: convocatoria.id },
    });

    if (existing) {
      await prisma.aspirante.update({
        where: { id: existing.id },
        data: { pelotonId: peloton.id },
      });
      updated++;
      continue;
    }

    missingBeforeCreate++;
    await prisma.aspirante.create({
      data: {
        nombres: row.nombres,
        apellidos: row.apellidos,
        cedula: row.cedula,
        sexo: row.sexo,
        fechaNacimiento: defaultFechaNacimiento(),
        lugarNacimiento: "Por definir",
        unidadPostulante: "Por definir",
        calificacionAdmision: CalificacionAdmision.APTO,
        convocatoriaId: convocatoria.id,
        pelotonId: peloton.id,
        contactos: {
          create: {
            nombre: "Por definir",
            parentesco: "No especificado",
            telefono: "0000000000",
          },
        },
        datosFisicos: { create: {} },
      },
    });
    created++;
    notMatched.push(`${row.cedula} ${row.apellidos} ${row.nombres} → P${row.peloton} (creado)`);
  }

  const counts = await Promise.all(
    [1, 2].map(async (n) => ({
      n,
      c: await prisma.aspirante.count({
        where: { convocatoriaId: convocatoria.id, pelotonId: pMap.get(n)!.id },
      }),
    })),
  );

  console.log(
    `Convocatoria ${convocatoria.codigo}. Actualizados: ${updated}. Creados: ${created} (no estaban: ${missingBeforeCreate}).`,
  );
  for (const { n, c } of counts) {
    console.log(`  ${nombrePelotonPorDefecto(n)}: ${c} aspirantes`);
  }
  if (notMatched.length) {
    console.log("Creados (no existían por cédula):");
    for (const line of notMatched) console.log(`  - ${line}`);
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
