/**
 * Completa fichas desde «BASE DE DATOS DEL CEFOA 46.xlsx».
 * Cruza por cédula (solo dígitos). No crea aspirantes. Solo rellena si el campo está vacío.
 *
 * Ejecutar:
 *   .\node_modules\.bin\tsx.CMD prisma/import-base-datos-cefoa46.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import {
  ColorCabello,
  ColorOjos,
  ColorPiel,
  EstadoCivil,
  FactorRh,
  FormaLabios,
  FormaNariz,
  PrismaClient,
  SenaParticular,
  TallaUniformePatriota,
} from "../src/generated/prisma";
import { hasRealBirthDate } from "../src/lib/date";
import { isTallaUniformePatriota } from "../src/lib/aspirantes/tallas-familia";
import { homologarEstaturaCm } from "../src/lib/aspirantes/medidas";

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
  process.env.BASE_DATOS_CEFOA46_XLSX ??
  "c:\\Users\\javie\\Desktop\\BASE DE DATOS DEL CEFOA 46.xlsx";

const EMPTY = new Set([
  "",
  "-",
  "—",
  "–",
  "n/a",
  "na",
  "s/n",
  "no aplica",
  "no aplica.",
  "ninguna",
  "ninguno",
  "por definir",
  "sin datos",
  "null",
]);

function cellText(v: ExcelJS.CellValue): unknown {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object" && "text" in v) return (v as { text: string }).text;
  if (typeof v === "object" && "result" in v) return (v as { result: unknown }).result;
  if (typeof v === "object" && "richText" in v) {
    return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
  }
  if (typeof v === "object" && "hyperlink" in v) {
    const h = v as { text?: string; hyperlink?: string };
    return h.text ?? h.hyperlink ?? null;
  }
  return v;
}

function asText(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(Math.trunc(v)) : String(v);
  return String(v).replace(/\s+/g, " ").trim();
}

function isEmptyText(raw: string | null | undefined): boolean {
  const t = (raw ?? "").trim();
  if (!t) return true;
  return EMPTY.has(t.toLowerCase());
}

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function cedulaPersona(raw: string): string {
  const d = onlyDigits(raw);
  return d.length >= 6 && d.length <= 12 ? d : "";
}

function fold(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function excelSerialToDate(n: number): Date | null {
  if (!Number.isFinite(n) || n < 15000 || n > 50000) return null;
  const utc = Date.UTC(1899, 11, 30) + Math.round(n) * 86400000;
  const d = new Date(utc);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0);
}

function parseFecha(v: unknown): Date | null {
  if (v == null || v === "") return null;
  if (v instanceof Date && !Number.isNaN(v.getTime()) && v.getFullYear() > 1900) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate(), 12, 0, 0, 0);
  }
  if (typeof v === "number") return excelSerialToDate(v);
  const t = asText(v);
  if (!t) return null;
  const ve = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
  if (ve) {
    const day = Number(ve[1]);
    const month = Number(ve[2]);
    const year = Number(ve[3]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return date;
    }
  }
  if (/^\d{4,6}$/.test(t)) return excelSerialToDate(Number(t));
  return null;
}

function parseEstaturaCm(v: unknown): number | null {
  return homologarEstaturaCm(asText(v) || v);
}

function parseEstadoCivil(raw: string): EstadoCivil | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.startsWith("SOLTER")) return EstadoCivil.SOLTERO;
  if (f.startsWith("CASAD")) return EstadoCivil.CASADO;
  if (f.startsWith("DIVOR")) return EstadoCivil.DIVORCIADO;
  if (f.startsWith("VIUD")) return EstadoCivil.VIUDO;
  if (f.includes("UNION") || f.includes("CONCUB")) return EstadoCivil.UNION_ESTABLE;
  return null;
}

function parseSiNo(raw: string): boolean | null {
  const f = fold(raw);
  if (!f) return null;
  if (f === "SI" || f === "S") return true;
  if (f === "NO" || f === "N") return false;
  if (f.includes("NACIONALIZ")) return true;
  if (f.includes("EXTRANJ")) return false;
  return null;
}

function parseCabello(raw: string): ColorCabello | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("RUBIO")) return ColorCabello.RUBIO;
  if (f.includes("ROJIZ") || f.includes("PELIRROJ")) return ColorCabello.ROJIZO;
  if (f.includes("CANOS") || f.includes("GRIS") || f.includes("BLANC")) return ColorCabello.CANOSO;
  if (f.includes("CLARO")) return ColorCabello.CASTANO_CLARO;
  if (f.includes("OSCURO") || f.includes("CASTAN") || f.includes("CATAN") || f.includes("MARRON")) {
    return ColorCabello.CASTANO_OSCURO;
  }
  if (f.includes("NEGR")) return ColorCabello.NEGRO;
  return null;
}

function parseLabios(raw: string): FormaLabios | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("VOLUMIN") || f.includes("GRUES") || f.includes("GRAND")) return FormaLabios.VOLUMINOSOS;
  if (f.includes("AUMENT")) return FormaLabios.AUMENTADOS;
  if (f.includes("CENTRO")) return FormaLabios.GRUESO_EN_EL_CENTRO;
  if (f.includes("FIN") || f.includes("PEQUEN")) return FormaLabios.FINOS;
  if (f.includes("NORMAL")) return FormaLabios.NORMALES;
  return null;
}

function parseNariz(raw: string): FormaNariz | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("PERFIL")) return FormaNariz.PERFILADA;
  if (f.includes("ARQUE")) return FormaNariz.ARQUEADA;
  if (f.includes("ANCH")) return FormaNariz.ANCHA;
  if (f.includes("GRAND")) return FormaNariz.GRANDE;
  if (f.includes("PEQUEN") || f.includes("FINA") || f.includes("FINO")) return FormaNariz.PEQUENA;
  return null;
}

function parseOjos(raw: string): ColorOjos | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("AMBAR")) return ColorOjos.AMBAR;
  if (f.includes("AVELL")) return ColorOjos.AVELLANA;
  if (f.includes("VERDE")) return ColorOjos.VERDE;
  if (f.includes("AZUL")) return ColorOjos.AZUL;
  if (f.includes("GRIS")) return ColorOjos.GRIS;
  if (f.includes("NEGR")) return ColorOjos.NEGRO;
  if (f.includes("CAFE") || f.includes("MARRON") || f.includes("CASTAN")) return ColorOjos.CAFE;
  return null;
}

function parsePiel(raw: string): ColorPiel | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("NEGR")) return ColorPiel.NEGRA;
  if (f.includes("MARRON")) return ColorPiel.MARRON;
  if (f.includes("MOREN")) return ColorPiel.MORENA;
  if (f.includes("CLAR") || f.includes("BLANC")) return ColorPiel.CLARA;
  return null;
}

function parseSangre(raw: string): string | null {
  const f = fold(raw).replace(/ /g, "");
  if (!f || f === "RH") return null;
  if (f.includes("AB")) return "AB";
  if (f === "A" || f.startsWith("A")) return "A";
  if (f === "B" || f.startsWith("B")) return "B";
  if (f === "O" || f === "0" || f.includes("O")) return "O";
  return null;
}

function parseRh(raw: string): FactorRh | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("NEG")) return FactorRh.NEGATIVO;
  if (f.includes("POS") || f.includes("POIS")) return FactorRh.POSITIVO;
  return null;
}

function parseSena(raw: string): SenaParticular | null {
  const f = fold(raw);
  if (!f) return null;
  if (f.includes("NO POSEE") || f === "NINGUNA" || f === "NINGUNO") return SenaParticular.NINGUNA;
  if (f.includes("TATUA")) return SenaParticular.TATUAJE;
  if (f.includes("BERRUG") || f.includes("VERRUG")) return SenaParticular.BERRUGA;
  if (f.includes("MANCHA")) return SenaParticular.MANCHAS_DE_LA_PIEL;
  if (f.includes("LUNAR")) return SenaParticular.LUNARES;
  if (f.includes("CICATR")) return SenaParticular.CICATRIZ;
  if (f.includes("LESION") || f.includes("FALTA") || f.includes("APEND")) return SenaParticular.LESIONES;
  return SenaParticular.LESIONES;
}

function parsePatriota(raw: string): TallaUniformePatriota | null {
  const f = fold(raw).replace(/ /g, "");
  if (isTallaUniformePatriota(f)) return f as TallaUniformePatriota;
  if (f === "SM") return TallaUniformePatriota.SR;
  return null;
}

function missingStr(current: string | null | undefined): boolean {
  const t = (current ?? "").trim();
  if (isEmptyText(t)) return true;
  if (/^0+$/.test(t.replace(/\D/g, ""))) return true;
  return false;
}

function missingLugar(current: string): boolean {
  return isEmptyText(current) || fold(current) === "VENEZUELA";
}

function normName(raw: string): string {
  return fold(raw).replace(/\s+/g, " ");
}

function digitDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length !== b.length) return 99;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d += 1;
  return d;
}

type ExcelRow = {
  excelRow: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: Date | null;
  estadoCivil: EstadoCivil | null;
  unidadPostulante: string;
  nombreUniversidad: string;
  direccion: string;
  telefono: string;
  telefonoEmergencia: string;
  religion: string;
  colorCabello: ColorCabello | null;
  formaLabios: FormaLabios | null;
  formaNariz: FormaNariz | null;
  colorOjos: ColorOjos | null;
  colorPiel: ColorPiel | null;
  estaturaCm: number | null;
  tipoSangre: string | null;
  factorRh: FactorRh | null;
  senaParticular: SenaParticular | null;
  lugarNacimiento: string;
  correo: string;
  deporte: string;
  tallaUniformePatriota: TallaUniformePatriota | null;
  tallaCamisa: string;
  tallaCalzado: string;
  tallaGorra: string;
  padresVenezolanos: boolean | null;
  madreNombres: string;
  madreApellidos: string;
  madreCedula: string;
  madreFechaNacimiento: Date | null;
  padreNombres: string;
  padreApellidos: string;
  padreCedula: string;
  padreFechaNacimiento: Date | null;
  poseeViviendaPropia: boolean | null;
  carnetPatriaSerial: string;
  carnetPatriaCodigo: string;
  cuentaNominaBanfanb: string;
};

async function parseExcel(path: string): Promise<ExcelRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("DATA GENERAL") ?? wb.worksheets[0];
  if (!ws) throw new Error("No se encontró la hoja DATA GENERAL.");

  const out: ExcelRow[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 9) return;
    const val = (col: number) => cellText(row.getCell(col).value);
    const cedula = onlyDigits(asText(val(5)));
    if (cedula.length < 6) return;

    const universidad = asText(val(15));
    out.push({
      excelRow: rowNumber,
      cedula,
      apellidos: asText(val(3)),
      nombres: asText(val(4)),
      fechaNacimiento: parseFecha(val(6)),
      estadoCivil: parseEstadoCivil(asText(val(9))),
      unidadPostulante: asText(val(13)),
      nombreUniversidad: isEmptyText(universidad) ? "" : universidad,
      direccion: asText(val(18)),
      telefono: asText(val(19)),
      telefonoEmergencia: asText(val(20)),
      religion: asText(val(21)),
      colorCabello: parseCabello(asText(val(22))),
      formaLabios: parseLabios(asText(val(23))),
      formaNariz: parseNariz(asText(val(24))),
      colorOjos: parseOjos(asText(val(25))),
      colorPiel: parsePiel(asText(val(26))),
      estaturaCm: parseEstaturaCm(val(27)),
      tipoSangre: parseSangre(asText(val(28))),
      factorRh: parseRh(asText(val(29))),
      senaParticular: parseSena(asText(val(30))),
      lugarNacimiento: asText(val(31)),
      correo: asText(val(32)),
      deporte: asText(val(36)),
      tallaUniformePatriota: parsePatriota(asText(val(38))),
      tallaCamisa: asText(val(40)),
      tallaCalzado: asText(val(41)),
      tallaGorra: asText(val(42)),
      padresVenezolanos: parseSiNo(asText(val(43))),
      madreNombres: asText(val(44)),
      madreApellidos: asText(val(45)),
      madreCedula: cedulaPersona(asText(val(46))),
      madreFechaNacimiento: parseFecha(val(47)),
      padreNombres: asText(val(48)),
      padreApellidos: asText(val(49)),
      padreCedula: cedulaPersona(asText(val(50))),
      padreFechaNacimiento: parseFecha(val(51)),
      poseeViviendaPropia: parseSiNo(asText(val(53))),
      carnetPatriaSerial: asText(val(54)),
      carnetPatriaCodigo: asText(val(55)),
      cuentaNominaBanfanb: asText(val(56)),
    });
  });
  return out;
}

function setIfMissing<K extends string>(
  patch: Record<string, unknown>,
  key: K,
  current: unknown,
  next: unknown,
  empty: (v: unknown) => boolean,
) {
  if (next == null || next === "") return;
  if (typeof next === "string" && isEmptyText(next)) return;
  if (!empty(current)) return;
  patch[key] = next;
}

async function main() {
  const rows = await parseExcel(EXCEL_PATH);
  console.log(`Excel: ${rows.length} filas con cédula.`);

  const existing = await prisma.aspirante.findMany({
    include: {
      datosFisicos: true,
      contactos: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  const byCedula = new Map<string, typeof existing>();
  const byNombre = new Map<string, typeof existing>();
  const fechaCounts = new Map<string, number>();
  for (const a of existing) {
    const d = onlyDigits(a.cedula);
    const list = byCedula.get(d) ?? [];
    list.push(a);
    byCedula.set(d, list);
    const nk = `${normName(a.nombres)} ${normName(a.apellidos)}`;
    const nlist = byNombre.get(nk) ?? [];
    nlist.push(a);
    byNombre.set(nk, nlist);
    const key = a.fechaNacimiento.toISOString().slice(0, 10);
    fechaCounts.set(key, (fechaCounts.get(key) ?? 0) + 1);
  }

  function findAspirantes(row: ExcelRow): { hits: typeof existing; via: string } {
    const exact = byCedula.get(row.cedula) ?? [];
    if (exact.length) return { hits: exact, via: "cedula" };
    const nk = `${normName(row.nombres)} ${normName(row.apellidos)}`;
    const named = byNombre.get(nk) ?? [];
    if (named.length === 1 && digitDistance(onlyDigits(named[0]!.cedula), row.cedula) === 1) {
      return { hits: named, via: `nombre+cedula~ ${named[0]!.cedula}` };
    }
    return { hits: [], via: "" };
  }

  function missingBirth(date: Date): boolean {
    if (!hasRealBirthDate(date)) return true;
    const key = date.toISOString().slice(0, 10);
    return (fechaCounts.get(key) ?? 0) >= 10;
  }

  let matched = 0;
  let updated = 0;
  let unchanged = 0;
  const missing: string[] = [];
  const notes: string[] = [];

  for (const row of rows) {
    const { hits: found, via } = findAspirantes(row);
    if (found.length === 0) {
      missing.push(`fila ${row.excelRow} CI ${row.cedula} ${row.nombres} ${row.apellidos}`);
      continue;
    }
    matched += 1;
    if (via !== "cedula") {
      notes.push(`MATCH ${row.cedula} → ${via}`);
    }

    for (const current of found) {
      const aPatch: Record<string, unknown> = {};
      const fPatch: Record<string, unknown> = {};

      if (row.fechaNacimiento && missingBirth(current.fechaNacimiento)) {
        aPatch.fechaNacimiento = row.fechaNacimiento;
      }
      setIfMissing(aPatch, "estadoCivil", current.estadoCivil, row.estadoCivil, (v) => v == null);
      setIfMissing(
        aPatch,
        "unidadPostulante",
        current.unidadPostulante,
        row.unidadPostulante,
        (v) => missingStr(String(v ?? "")),
      );
      setIfMissing(
        aPatch,
        "nombreUniversidad",
        current.nombreUniversidad,
        row.nombreUniversidad,
        (v) => missingStr(v as string | null),
      );
      setIfMissing(aPatch, "direccion", current.direccion, row.direccion, (v) => missingStr(v as string | null));
      setIfMissing(aPatch, "telefono", current.telefono, row.telefono, (v) => missingStr(v as string | null));
      setIfMissing(aPatch, "religion", current.religion, row.religion, (v) => missingStr(v as string | null));
      if (row.lugarNacimiento && missingLugar(current.lugarNacimiento)) {
        aPatch.lugarNacimiento = row.lugarNacimiento;
      }
      setIfMissing(aPatch, "correo", current.correo, row.correo, (v) => missingStr(v as string | null));
      setIfMissing(aPatch, "deporte", current.deporte, row.deporte, (v) => missingStr(v as string | null));
      setIfMissing(
        aPatch,
        "padresVenezolanos",
        current.padresVenezolanos,
        row.padresVenezolanos,
        (v) => v == null,
      );
      setIfMissing(aPatch, "madreNombres", current.madreNombres, row.madreNombres, (v) => missingStr(v as string | null));
      setIfMissing(
        aPatch,
        "madreApellidos",
        current.madreApellidos,
        row.madreApellidos,
        (v) => missingStr(v as string | null),
      );
      setIfMissing(aPatch, "madreCedula", current.madreCedula, row.madreCedula, (v) => missingStr(v as string | null));
      if (row.madreFechaNacimiento && current.madreFechaNacimiento == null) {
        aPatch.madreFechaNacimiento = row.madreFechaNacimiento;
      }
      setIfMissing(aPatch, "padreNombres", current.padreNombres, row.padreNombres, (v) => missingStr(v as string | null));
      setIfMissing(
        aPatch,
        "padreApellidos",
        current.padreApellidos,
        row.padreApellidos,
        (v) => missingStr(v as string | null),
      );
      setIfMissing(aPatch, "padreCedula", current.padreCedula, row.padreCedula, (v) => missingStr(v as string | null));
      if (row.padreFechaNacimiento && current.padreFechaNacimiento == null) {
        aPatch.padreFechaNacimiento = row.padreFechaNacimiento;
      }
      setIfMissing(
        aPatch,
        "poseeViviendaPropia",
        current.poseeViviendaPropia,
        row.poseeViviendaPropia,
        (v) => v == null,
      );
      setIfMissing(
        aPatch,
        "carnetPatriaSerial",
        current.carnetPatriaSerial,
        row.carnetPatriaSerial,
        (v) => missingStr(v as string | null),
      );
      setIfMissing(
        aPatch,
        "carnetPatriaCodigo",
        current.carnetPatriaCodigo,
        row.carnetPatriaCodigo,
        (v) => missingStr(v as string | null),
      );
      setIfMissing(
        aPatch,
        "cuentaNominaBanfanb",
        current.cuentaNominaBanfanb,
        row.cuentaNominaBanfanb,
        (v) => missingStr(v as string | null),
      );

      const f = current.datosFisicos;
      setIfMissing(fPatch, "colorCabello", f?.colorCabello, row.colorCabello, (v) => v == null);
      setIfMissing(fPatch, "formaLabios", f?.formaLabios, row.formaLabios, (v) => v == null);
      setIfMissing(fPatch, "formaNariz", f?.formaNariz, row.formaNariz, (v) => v == null);
      setIfMissing(fPatch, "colorOjos", f?.colorOjos, row.colorOjos, (v) => v == null);
      setIfMissing(fPatch, "colorPiel", f?.colorPiel, row.colorPiel, (v) => v == null);
      setIfMissing(fPatch, "estaturaCm", f?.estaturaCm, row.estaturaCm, (v) => v == null);
      setIfMissing(fPatch, "tipoSangre", f?.tipoSangre, row.tipoSangre, (v) => missingStr(v as string | null));
      setIfMissing(fPatch, "factorRh", f?.factorRh, row.factorRh, (v) => v == null);
      setIfMissing(fPatch, "senaParticular", f?.senaParticular, row.senaParticular, (v) => v == null);
      setIfMissing(
        fPatch,
        "tallaUniformePatriota",
        f?.tallaUniformePatriota,
        row.tallaUniformePatriota,
        (v) => v == null,
      );
      setIfMissing(fPatch, "tallaCamisa", f?.tallaCamisa, row.tallaCamisa, (v) => missingStr(v as string | null));
      setIfMissing(fPatch, "tallaCalzado", f?.tallaCalzado, row.tallaCalzado, (v) => missingStr(v as string | null));
      setIfMissing(fPatch, "tallaGorra", f?.tallaGorra, row.tallaGorra, (v) => missingStr(v as string | null));

      const contacto = current.contactos[0];
      const needContacto =
        !isEmptyText(row.telefonoEmergencia) &&
        (contacto == null || missingStr(contacto.telefono) || contacto.telefono === "—");

      const hasA = Object.keys(aPatch).length > 0;
      const hasF = Object.keys(fPatch).length > 0;
      if (!hasA && !hasF && !needContacto) {
        unchanged += 1;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        if (hasA) {
          await tx.aspirante.update({ where: { id: current.id }, data: aPatch });
        }
        if (hasF) {
          await tx.datosFisicosMedicos.upsert({
            where: { aspiranteId: current.id },
            create: { aspiranteId: current.id, ...fPatch },
            update: fPatch,
          });
        }
        if (needContacto) {
          if (contacto) {
            await tx.contactoEmergencia.update({
              where: { id: contacto.id },
              data: { telefono: row.telefonoEmergencia },
            });
          } else {
            await tx.contactoEmergencia.create({
              data: {
                aspiranteId: current.id,
                nombre: "Contacto de emergencia",
                parentesco: "Por definir",
                telefono: row.telefonoEmergencia,
              },
            });
          }
        }
      });

      updated += 1;
      notes.push(
        `${current.cedula}: +${Object.keys(aPatch).join(",")}${hasF ? ` fisico:${Object.keys(fPatch).join(",")}` : ""}${needContacto ? " emergencia" : ""}`,
      );
    }
  }

  console.log(`Coincidencias: ${matched}`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Sin cambios: ${unchanged}`);
  console.log(`Sin ficha en el sistema: ${missing.length}`);
  if (missing.length) {
    console.log("No encontrados:");
    for (const m of missing) console.log(`  ${m}`);
  }
  console.log("Detalle:");
  for (const n of notes) console.log(`  ${n}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
