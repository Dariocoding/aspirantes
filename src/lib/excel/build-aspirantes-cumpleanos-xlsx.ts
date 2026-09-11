import ExcelJS from "exceljs";
import { hasRealBirthDate } from "@src/lib/date";
import { MESES_TITULO } from "@src/lib/meses";

export type AspiranteCumpleanosExportRow = {
  nombres: string;
  apellidos: string;
  cedula: string;
  fechaNacimiento: Date;
  edad: number | null;
};

export type BuildAspirantesCumpleanosXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  rows: AspiranteCumpleanosExportRow[];
  generatedAt: Date;
};

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFCBD5E1" } },
  left: { style: "thin", color: { argb: "FFCBD5E1" } },
  bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
  right: { style: "thin", color: { argb: "FFCBD5E1" } },
};

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF334155" } };
const ZEBRA_A = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF8FAFC" } };
const ZEBRA_B = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFFF" } };
const EMPTY_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF1F5F9" } };

/** Colores de banner por mes (ARGB). */
const MONTH_BANNER_COLORS = [
  "FF0EA5E9", // enero — cielo
  "FFEC4899", // febrero — rosa
  "FF22C55E", // marzo — verde
  "FFF59E0B", // abril — ámbar
  "FF8B5CF6", // mayo — violeta
  "FF14B8A6", // junio — teal
  "FFEF4444", // julio — rojo
  "FFF97316", // agosto — naranja
  "FF6366F1", // septiembre — índigo
  "FFD97706", // octubre — ámbar oscuro
  "FF64748B", // noviembre — pizarra
  "FF0F766E", // diciembre — verde azulado
] as const;

const SIN_FECHA_BANNER = "FF94A3B8";

const HEADERS = ["N°", "DÍA", "NOMBRE COMPLETO", "CÉDULA", "FECHA DE NACIMIENTO", "EDAD"] as const;
const COL_WIDTHS = [6, 8, 42, 14, 20, 10] as const;
const LAST_COL = HEADERS.length;

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = BORDER;
}

function solidFill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function formatFechaNacimiento(date: Date): string {
  if (!hasRealBirthDate(date)) return "";
  return date.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function groupByMonth(rows: AspiranteCumpleanosExportRow[]) {
  const byMonth = new Map<number, AspiranteCumpleanosExportRow[]>();
  const sinFecha: AspiranteCumpleanosExportRow[] = [];

  for (const row of rows) {
    if (!hasRealBirthDate(row.fechaNacimiento)) {
      sinFecha.push(row);
      continue;
    }
    const mes = row.fechaNacimiento.getMonth();
    const list = byMonth.get(mes) ?? [];
    list.push(row);
    byMonth.set(mes, list);
  }

  for (const list of byMonth.values()) {
    list.sort((a, b) => {
      const dayDiff = a.fechaNacimiento.getDate() - b.fechaNacimiento.getDate();
      if (dayDiff !== 0) return dayDiff;
      const nombreA = `${a.nombres} ${a.apellidos}`.trim();
      const nombreB = `${b.nombres} ${b.apellidos}`.trim();
      const nameDiff = nombreA.localeCompare(nombreB, "es");
      if (nameDiff !== 0) return nameDiff;
      return a.cedula.localeCompare(b.cedula, "es", { numeric: true });
    });
  }

  sinFecha.sort((a, b) => {
    const nombreA = `${a.nombres} ${a.apellidos}`.trim();
    const nombreB = `${b.nombres} ${b.apellidos}`.trim();
    return nombreA.localeCompare(nombreB, "es");
  });

  return { byMonth, sinFecha };
}

function writeMergedBanner(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  text: string,
  fillArgb: string,
  opts?: { fontSize?: number; height?: number },
) {
  ws.mergeCells(rowNum, 1, rowNum, LAST_COL);
  const cell = ws.getCell(rowNum, 1);
  cell.value = text;
  cell.font = {
    name: "Calibri",
    size: opts?.fontSize ?? 12,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  cell.fill = solidFill(fillArgb);
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(cell);
  for (let c = 2; c <= LAST_COL; c++) {
    const side = ws.getCell(rowNum, c);
    side.fill = solidFill(fillArgb);
    applyCellBorder(side);
  }
  ws.getRow(rowNum).height = opts?.height ?? 26;
}

function writeColumnHeaders(ws: ExcelJS.Worksheet, rowNum: number) {
  const headerRow = ws.getRow(rowNum);
  headerRow.height = 22;
  HEADERS.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });
}

function writePersonRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  idxInMonth: number,
  r: AspiranteCumpleanosExportRow,
) {
  const row = ws.getRow(rowNum);
  const zebra = idxInMonth % 2 === 0 ? ZEBRA_A : ZEBRA_B;
  const nombreCompleto = `${r.nombres} ${r.apellidos}`.trim().toUpperCase();
  const hasDate = hasRealBirthDate(r.fechaNacimiento);

  const values: Array<string | number> = [
    idxInMonth + 1,
    hasDate ? r.fechaNacimiento.getDate() : "",
    nombreCompleto,
    r.cedula,
    formatFechaNacimiento(r.fechaNacimiento),
    r.edad ?? "",
  ];

  values.forEach((value, i) => {
    const cell = row.getCell(i + 1);
    cell.value = value;
    cell.fill = zebra;
    cell.font = {
      name: i === 0 || i === 1 || i === 3 || i === 5 ? "Consolas" : "Calibri",
      size: 11,
      color: { argb: "FF0F172A" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: i === 2 ? "left" : "center",
    };
    applyCellBorder(cell);
  });
}

function writeEmptyMonthRow(ws: ExcelJS.Worksheet, rowNum: number) {
  ws.mergeCells(rowNum, 1, rowNum, LAST_COL);
  const cell = ws.getCell(rowNum, 1);
  cell.value = "Sin cumpleaños registrados en este mes";
  cell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF64748B" } };
  cell.fill = EMPTY_FILL;
  cell.alignment = { vertical: "middle", horizontal: "center" };
  applyCellBorder(cell);
  for (let c = 2; c <= LAST_COL; c++) {
    const side = ws.getCell(rowNum, c);
    side.fill = EMPTY_FILL;
    applyCellBorder(side);
  }
  ws.getRow(rowNum).height = 20;
}

export async function buildAspirantesCumpleanosXlsxBuffer(
  params: BuildAspirantesCumpleanosXlsxParams,
): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, generatedAt } = params;
  const { byMonth, sinFecha } = groupByMonth(rows);
  const conFecha = rows.length - sinFecha.length;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Cumpleaños por mes", {
    views: [{ state: "frozen", ySplit: 3, activeCell: "A4", showGridLines: false }],
    properties: { defaultRowHeight: 20 },
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: "1:3",
    },
  });

  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // —— Encabezado ——
  ws.mergeCells(1, 1, 1, LAST_COL);
  const title = ws.getCell(1, 1);
  title.value = "LISTADO DE CUMPLEAÑOS POR MES — ASPIRANTES";
  title.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = solidFill("FF0F172A");
  title.alignment = { vertical: "middle", horizontal: "center" };
  applyCellBorder(title);
  for (let c = 2; c <= LAST_COL; c++) {
    const side = ws.getCell(1, c);
    side.fill = solidFill("FF0F172A");
    applyCellBorder(side);
  }
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, LAST_COL);
  const sub = ws.getCell(2, 1);
  sub.value = `${convocatoriaNombre}  ·  ${convocatoriaCodigo}  ·  ${anio}  ·  Con fecha: ${conFecha}  ·  Sin fecha: ${sinFecha.length}  ·  Generado: ${generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}`;
  sub.font = { name: "Calibri", size: 10, color: { argb: "FF334155" } };
  sub.fill = solidFill("FFE2E8F0");
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(sub);
  for (let c = 2; c <= LAST_COL; c++) {
    const side = ws.getCell(2, c);
    side.fill = solidFill("FFE2E8F0");
    applyCellBorder(side);
  }
  ws.getRow(2).height = 20;

  // —— Resumen por mes ——
  ws.mergeCells(3, 1, 3, LAST_COL);
  const resumenParts = MESES_TITULO.map((nombre, i) => {
    const n = byMonth.get(i)?.length ?? 0;
    return `${nombre.slice(0, 3)} ${n}`;
  });
  const resumen = ws.getCell(3, 1);
  resumen.value = `Resumen:  ${resumenParts.join("  ·  ")}`;
  resumen.font = { name: "Calibri", size: 9, color: { argb: "FF475569" } };
  resumen.fill = solidFill("FFF8FAFC");
  resumen.alignment = { vertical: "middle", horizontal: "left", indent: 1, wrapText: true };
  applyCellBorder(resumen);
  for (let c = 2; c <= LAST_COL; c++) {
    const side = ws.getCell(3, c);
    side.fill = solidFill("FFF8FAFC");
    applyCellBorder(side);
  }
  ws.getRow(3).height = 22;

  let rowNum = 4;

  // —— Secciones por mes (enero → diciembre) ——
  for (let mes = 0; mes < 12; mes++) {
    const monthRows = byMonth.get(mes) ?? [];
    const monthName = MESES_TITULO[mes]!.toUpperCase();
    const bannerColor = MONTH_BANNER_COLORS[mes]!;

    // Espacio entre meses
    if (mes > 0) {
      rowNum += 1;
      ws.getRow(rowNum).height = 8;
      rowNum += 1;
    } else {
      rowNum += 1;
    }

    writeMergedBanner(
      ws,
      rowNum,
      `${monthName}  ·  ${monthRows.length} ${monthRows.length === 1 ? "aspirante" : "aspirantes"}`,
      bannerColor,
      { fontSize: 13, height: 28 },
    );
    rowNum += 1;

    writeColumnHeaders(ws, rowNum);
    rowNum += 1;

    if (monthRows.length === 0) {
      writeEmptyMonthRow(ws, rowNum);
      rowNum += 1;
      continue;
    }

    monthRows.forEach((r, idx) => {
      writePersonRow(ws, rowNum, idx, r);
      rowNum += 1;
    });
  }

  // —— Sin fecha ——
  if (sinFecha.length > 0) {
    rowNum += 1;
    ws.getRow(rowNum).height = 8;
    rowNum += 1;

    writeMergedBanner(
      ws,
      rowNum,
      `SIN FECHA DE NACIMIENTO  ·  ${sinFecha.length} ${sinFecha.length === 1 ? "aspirante" : "aspirantes"}`,
      SIN_FECHA_BANNER,
      { fontSize: 12, height: 26 },
    );
    rowNum += 1;

    writeColumnHeaders(ws, rowNum);
    rowNum += 1;

    sinFecha.forEach((r, idx) => {
      writePersonRow(ws, rowNum, idx, r);
      rowNum += 1;
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
