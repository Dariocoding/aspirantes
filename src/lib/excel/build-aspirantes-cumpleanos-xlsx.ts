import ExcelJS from "exceljs";
import { hasRealBirthDate } from "@src/lib/date";

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

const HEADER_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1E293B" } };
const ZEBRA_A = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF8FAFC" } };
const ZEBRA_B = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFFF" } };

const HEADERS = ["N°", "NOMBRE COMPLETO", "CÉDULA", "FECHA DE CUMPLEAÑOS", "EDAD"] as const;
const COL_WIDTHS = [6, 42, 14, 20, 10] as const;

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = BORDER;
}

function formatFechaCumpleanos(date: Date): string {
  if (!hasRealBirthDate(date)) return "";
  return date.toLocaleDateString("es-VE");
}

export async function buildAspirantesCumpleanosXlsxBuffer(
  params: BuildAspirantesCumpleanosXlsxParams,
): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, generatedAt } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Cumpleaños", {
    views: [{ state: "frozen", ySplit: 3, xSplit: 1, activeCell: "A4", showGridLines: true }],
    properties: { defaultRowHeight: 20 },
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const lastCol = HEADERS.length;

  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = "LISTADO DE CUMPLEAÑOS — ASPIRANTES";
  title.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  applyCellBorder(title);
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, lastCol);
  const sub = ws.getCell(2, 1);
  sub.value = `${convocatoriaNombre}  ·  ${convocatoriaCodigo}  ·  ${anio}  ·  Total: ${rows.length}  ·  Generado: ${generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}`;
  sub.font = { name: "Calibri", size: 10, color: { argb: "FF334155" } };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(sub);
  ws.getRow(2).height = 20;

  const headerRow = ws.getRow(3);
  headerRow.height = 26;
  HEADERS.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });

  rows.forEach((r, idx) => {
    const rowNum = 4 + idx;
    const row = ws.getRow(rowNum);
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    const nombreCompleto = `${r.nombres} ${r.apellidos}`.trim().toUpperCase();

    const values: Array<string | number> = [
      idx + 1,
      nombreCompleto,
      r.cedula,
      formatFechaCumpleanos(r.fechaNacimiento),
      r.edad ?? "",
    ];

    values.forEach((value, i) => {
      const cell = row.getCell(i + 1);
      cell.value = value;
      cell.fill = zebra;
      cell.font = {
        name: i === 0 || i === 2 || i === 4 ? "Consolas" : "Calibri",
        size: 11,
        color: { argb: "FF0F172A" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: i === 1 ? "left" : "center",
      };
      applyCellBorder(cell);
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
