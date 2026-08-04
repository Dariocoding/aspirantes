/**
 * Vacía todos los aspirantes e importa la «LISTA INICIAL 03AGO26».
 *
 * Ejecutar:
 *   .\node_modules\.bin\tsx.CMD prisma/import-lista-inicial-03ago26.ts
 *
 * Mapeo:
 *   DENTRO / APTO           → APTO
 *   CONDICIONAL (cualquier) → EN_EVALUACION
 *
 * El Excel tiene TRES bloques horizontales (cols A–I, K–S, U–AC).
 * Asocia a la convocatoria activa; si no hay, a la más antigua.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { CalificacionAdmision, PrismaClient, Sexo } from "../src/generated/prisma";

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
  process.env.LISTA_INICIAL_XLSX ??
  "c:\\Users\\javie\\AppData\\Local\\Packages\\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\\LocalState\\sessions\\4A88619E9D666E0DE3E18939FE91ABD689AAAE15\\transfers\\2026-31\\A. LISTA INICIAL 03AGO26.xlsx";

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

function splitNombreCompleto(full: string): { nombres: string; apellidos: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombres: "SIN NOMBRE", apellidos: "SIN APELLIDO" };
  if (parts.length === 1) return { nombres: parts[0]!, apellidos: "-" };
  if (parts.length === 2) return { nombres: parts[0]!, apellidos: parts[1]! };
  if (parts.length === 3) return { nombres: `${parts[0]} ${parts[1]}`, apellidos: parts[2]! };
  return { nombres: parts.slice(0, -2).join(" "), apellidos: parts.slice(-2).join(" ") };
}

function parseFecha(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const d = new Date(v);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  if (typeof v === "string" && v.trim()) {
    const s = v.trim();
    // DD/MM/YYYY o D/M/YYYY
    const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(s);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]);
      const year = Number(m[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const d = new Date(year, month - 1, day, 12, 0, 0, 0);
        if (
          d.getFullYear() === year &&
          d.getMonth() === month - 1 &&
          d.getDate() === day
        ) {
          return d;
        }
      }
      return null;
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(12, 0, 0, 0);
      return d;
    }
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  return null;
}

function parseEdad(v: unknown, fecha: Date | null): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    const n = Math.round(v);
    if (n >= 16 && n <= 80) return n;
  }
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.trim());
    if (Number.isFinite(n) && n >= 16 && n <= 80) return Math.round(n);
  }
  if (fecha) {
    const now = new Date();
    let edad = now.getFullYear() - fecha.getFullYear();
    const m = now.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < fecha.getDate())) edad--;
    if (edad >= 16 && edad <= 80) return edad;
  }
  return DEFAULT_EDAD;
}

function parseSexo(v: unknown): Sexo {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  if (s === "F" || s === "FEMENINO" || s.startsWith("F")) return Sexo.FEMENINO;
  return Sexo.MASCULINO;
}

function mapSituacion(raw: string): CalificacionAdmision {
  const s = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (s.startsWith("DENTRO")) return CalificacionAdmision.APTO;
  if (s.includes("CONDICIONAL")) return CalificacionAdmision.EN_EVALUACION;
  if (s.includes("NO APTO") || s.includes("NO_APTO")) return CalificacionAdmision.NO_APTO;
  if (s === "APTO" || s.startsWith("APTO ")) return CalificacionAdmision.APTO;
  return CalificacionAdmision.EN_EVALUACION;
}

function mergeObservaciones(situacion: string, obs: string | null): string | null {
  const sit = situacion.trim();
  const sitNorm = sit.toUpperCase().replace(/\s+/g, " ");
  const sitEsSoloEstado =
    sitNorm === "DENTRO" ||
    sitNorm === "CONDICIONAL" ||
    sitNorm.startsWith("CONDICIONAL ");
  const parts: string[] = [];
  if (sit && !sitEsSoloEstado) parts.push(sit);
  if (obs) parts.push(obs);
  return parts.length ? parts.join("\n") : null;
}

function telefonoStr(v: unknown): string | null {
  if (v == null || v === "") return null;
  const digits = onlyDigits(String(v));
  return digits.length > 0 ? digits : null;
}

type ParsedRow = {
  excelRow: number;
  side: "L" | "R" | "T";
  situacion: string;
  nombreCompleto: string;
  cedula: string;
  fechaNacimiento: Date;
  edad: number;
  sexo: Sexo;
  telefono: string | null;
  observaciones: string | null;
  calificacion: CalificacionAdmision;
};

async function readExcel(path: string): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("El Excel no tiene hojas.");

  const out: ParsedRow[] = [];
  // Tres bloques lado a lado: DENTRO | CONDICIONAL | CONDICIONAL (continuación N° 78+)
  const sides = [
    { side: "L" as const, cols: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { side: "R" as const, cols: [11, 12, 13, 14, 15, 16, 17, 18, 19] },
    { side: "T" as const, cols: [21, 22, 23, 24, 25, 26, 27, 28, 29] },
  ];

  for (let r = 13; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    for (const { side, cols } of sides) {
      const nombreRaw = cellText(row.getCell(cols[2]!).value);
      if (nombreRaw == null || String(nombreRaw).trim() === "") continue;

      const situacion = String(cellText(row.getCell(cols[1]!).value) ?? "").trim();
      const nombreCompleto = String(nombreRaw).trim();
      const cedula = onlyDigits(String(cellText(row.getCell(cols[3]!).value) ?? ""));
      let fecha = parseFecha(cellText(row.getCell(cols[4]!).value));
      const edadRaw = cellText(row.getCell(cols[5]!).value);
      const sexoRaw = cellText(row.getCell(cols[6]!).value);
      const tel = telefonoStr(cellText(row.getCell(cols[7]!).value));
      const obsRaw = cellText(row.getCell(cols[8]!).value);
      const obsBase =
        obsRaw == null || String(obsRaw).trim() === "" ? null : String(obsRaw).trim();
      const observaciones = mergeObservaciones(situacion, obsBase);

      if (!fecha) {
        console.warn(
          `Fila ${r} (${side}) ${nombreCompleto}: sin fecha válida → placeholder edad ${DEFAULT_EDAD}.`,
        );
        fecha = defaultFechaNacimiento();
      }

      if (sexoRaw == null || String(sexoRaw).trim() === "") {
        console.warn(
          `Fila ${r} (${side}) ${nombreCompleto}: sin sexo → se asume MASCULINO.`,
        );
      }

      out.push({
        excelRow: r,
        side,
        situacion,
        nombreCompleto,
        cedula,
        fechaNacimiento: fecha,
        edad: parseEdad(edadRaw, fecha),
        sexo: parseSexo(sexoRaw),
        telefono: tel,
        observaciones,
        calificacion: mapSituacion(situacion),
      });
    }
  }

  return out;
}

async function main() {
  const rows = await readExcel(EXCEL_PATH);
  const bySide = {
    L: rows.filter((r) => r.side === "L").length,
    R: rows.filter((r) => r.side === "R").length,
    T: rows.filter((r) => r.side === "T").length,
  };
  console.log(
    `Excel leído: ${rows.length} aspirantes (bloque DENTRO: ${bySide.L}, CONDICIONAL centro: ${bySide.R}, CONDICIONAL derecha: ${bySide.T}).`,
  );

  const invalidCedula = rows.filter((r) => r.cedula.length < 6 || r.cedula.length > 12);
  if (invalidCedula.length) {
    for (const r of invalidCedula) {
      console.warn(`Cédula inválida, se omitirá: ${r.nombreCompleto} → "${r.cedula}"`);
    }
  }

  const valid = rows.filter((r) => r.cedula.length >= 6 && r.cedula.length <= 12);
  const seen = new Set<string>();
  const unique: ParsedRow[] = [];
  for (const r of valid) {
    if (seen.has(r.cedula)) {
      console.warn(`Cédula duplicada en Excel, se omite segunda: ${r.cedula} (${r.nombreCompleto})`);
      continue;
    }
    seen.add(r.cedula);
    unique.push(r);
  }

  const convocatoria =
    (await prisma.convocatoria.findFirst({ where: { activa: true } })) ??
    (await prisma.convocatoria.findFirst({ orderBy: { createdAt: "asc" } }));

  if (!convocatoria) {
    throw new Error(
      "No hay ninguna convocatoria en la base de datos. Crea una convocatoria y vuelve a ejecutar.",
    );
  }

  const before = await prisma.aspirante.count();

  // Orden: contactos y datos físicos caen en cascada; esquelas dejan aspiranteId en null.
  const deleted = await prisma.aspirante.deleteMany({});
  console.log(
    `Aspirantes eliminados: ${deleted.count} (había ${before}). Convocatoria destino: ${convocatoria.codigo} (${convocatoria.activa ? "activa" : "inactiva"}).`,
  );

  let inserted = 0;
  for (const row of unique) {
    const { nombres, apellidos } = splitNombreCompleto(row.nombreCompleto);
    await prisma.aspirante.create({
      data: {
        unidadPostulante: "Por definir",
        calificacionAdmision: row.calificacion,
        nombres,
        apellidos,
        cedula: row.cedula,
        edad: row.edad,
        sexo: row.sexo,
        fechaNacimiento: row.fechaNacimiento,
        lugarNacimiento: "Por definir",
        direccion: null,
        telefono: row.telefono,
        correo: null,
        hijosCantidad: 0,
        convocatoriaId: convocatoria.id,
        datosFisicos: {
          create: {
            observaciones: row.observaciones,
          },
        },
        contactos: {
          create: {
            nombre: "Por definir",
            parentesco: "No especificado",
            telefono: "0000000000",
            direccion: null,
          },
        },
      },
    });
    inserted++;
  }

  const after = await prisma.aspirante.count();
  const aptos = await prisma.aspirante.count({
    where: { calificacionAdmision: CalificacionAdmision.APTO },
  });
  const enEval = await prisma.aspirante.count({
    where: { calificacionAdmision: CalificacionAdmision.EN_EVALUACION },
  });

  console.log(
    `Importación lista. Insertados: ${inserted}. Total en BD: ${after}. APTOS (DENTRO): ${aptos}. EN_EVALUACION (CONDICIONAL): ${enEval}.`,
  );
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
