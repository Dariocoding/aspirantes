import ExcelJS from "exceljs";
import {
  CENSUS_IMPORT_SKIP_IDS,
  censusExportColumnIdFromHeader,
  normalizeCensusCedula,
} from "@src/lib/aspirantes/census-export-columns";

export type CensusImportRow = {
  excelRow: number;
  cedula: string;
  values: Record<string, string>;
};

export type CensusImportParseOk = {
  columnIds: string[];
  rows: CensusImportRow[];
  skipped: number;
};

export function excelCellToText(value: ExcelJS.CellValue): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return value.toLocaleDateString("es-VE");
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((p) => p.text).join("").trim();
    }
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value) return excelCellToText(value.result as ExcelJS.CellValue);
    if ("error" in value) return "";
  }
  return String(value).trim();
}

function findHeaderRow(ws: ExcelJS.Worksheet): { rowNumber: number; map: Map<number, string> } | null {
  const maxScan = Math.min(12, ws.rowCount || 12);
  for (let r = 1; r <= maxScan; r++) {
    const row = ws.getRow(r);
    const map = new Map<number, string>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const id = censusExportColumnIdFromHeader(excelCellToText(cell.value));
      if (id) map.set(colNumber, id);
    });
    const ids = [...map.values()];
    if (ids.includes("cedula") && ids.length >= 2) {
      return { rowNumber: r, map };
    }
  }
  return null;
}

export async function parseAspirantesCensoXlsxBuffer(buffer: ArrayBuffer | Buffer): Promise<CensusImportParseOk> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as ExcelJS.Buffer);
  const ws = wb.getWorksheet("Censo") ?? wb.worksheets[0];
  if (!ws) {
    throw new Error("El archivo no contiene una hoja de cálculo.");
  }

  const header = findHeaderRow(ws);
  if (!header) {
    throw new Error("No se encontró una fila de encabezados con Cédula. Exporte un Excel del censo y úselo como plantilla.");
  }

  const columnIds = [...new Set(header.map.values())];
  if (!columnIds.includes("cedula")) {
    throw new Error("La hoja debe incluir la columna Cédula: es la clave para actualizar.");
  }

  const writableIds = columnIds.filter((id) => !CENSUS_IMPORT_SKIP_IDS.has(id));
  const rows: CensusImportRow[] = [];
  let skipped = 0;
  const seen = new Set<string>();
  const last = ws.rowCount || header.rowNumber;
  const maxRows = header.rowNumber + 2500;

  for (let r = header.rowNumber + 1; r <= Math.min(last, maxRows); r++) {
    const row = ws.getRow(r);
    const values: Record<string, string> = {};
    let hasAny = false;
    header.map.forEach((id, colNumber) => {
      if (CENSUS_IMPORT_SKIP_IDS.has(id)) return;
      const text = excelCellToText(row.getCell(colNumber).value);
      values[id] = text;
      if (text) hasAny = true;
    });
    if (!hasAny) {
      skipped += 1;
      continue;
    }
    const cedula = normalizeCensusCedula(values.cedula ?? "");
    if (!cedula) {
      throw new Error(`Fila ${r}: falta la cédula.`);
    }
    if (cedula.length < 6 || cedula.length > 12) {
      throw new Error(`Fila ${r}: cédula inválida (${cedula}). Use 6 a 12 dígitos.`);
    }
    if (seen.has(cedula)) {
      throw new Error(`Fila ${r}: la cédula ${cedula} está repetida en el archivo.`);
    }
    seen.add(cedula);
    values.cedula = cedula;
    rows.push({ excelRow: r, cedula, values });
  }

  if (!rows.length) {
    throw new Error("No hay filas con datos para importar.");
  }

  return { columnIds: writableIds, rows, skipped };
}
