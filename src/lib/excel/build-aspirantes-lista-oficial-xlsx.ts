import ExcelJS from "exceljs";

export type AspiranteListaOficialExportRow = {
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: string;
};

export type BuildAspirantesListaOficialXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  rows: AspiranteListaOficialExportRow[];
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

const JQUIA_FIJA = "ASP OFICIAL";

const HEADERS = [
  "N°",
  "EL NÚMERO",
  "JQUIA",
  "PRIMER APELLIDO",
  "SEGUNDO APELLIDO",
  "PRIMER NOMBRE",
  "SEGUNDO NOMBRE",
  "CÉDULA",
  "SEXO",
] as const;

const COL_WIDTHS = [6, 10, 14, 18, 18, 18, 18, 14, 12] as const;

/** Parte un nombre o apellido compuesto en primer / segundo token. */
export function splitNombreApellido(value: string): { primero: string; segundo: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { primero: "", segundo: "" };
  if (parts.length === 1) return { primero: parts[0]!, segundo: "" };
  return { primero: parts[0]!, segundo: parts.slice(1).join(" ") };
}

function sexoCelda(sexo: string): string {
  if (sexo === "FEMENINO") return "F";
  if (sexo === "MASCULINO") return "M";
  return sexo;
}

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = BORDER;
}

export async function buildAspirantesListaOficialXlsxBuffer(
  params: BuildAspirantesListaOficialXlsxParams,
): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, generatedAt } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Lista oficial", {
    views: [{ state: "frozen", ySplit: 3, xSplit: 1, activeCell: "A4", showGridLines: true }],
    properties: { defaultRowHeight: 20 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const lastCol = HEADERS.length;

  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = "LISTA SENCILLA — ASPIRANTES";
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
  headerRow.height = 28;
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
    const apellidos = splitNombreApellido(r.apellidos);
    const nombres = splitNombreApellido(r.nombres);
    const n = idx + 1;

    const values: Array<string | number> = [
      n,
      n,
      JQUIA_FIJA,
      apellidos.primero.toUpperCase(),
      apellidos.segundo.toUpperCase(),
      nombres.primero.toUpperCase(),
      nombres.segundo.toUpperCase(),
      r.cedula,
      sexoCelda(r.sexo),
    ];

    values.forEach((value, i) => {
      const cell = row.getCell(i + 1);
      cell.value = value;
      cell.fill = zebra;
      cell.font = {
        name: i === 0 || i === 1 || i === 7 ? "Consolas" : "Calibri",
        size: 11,
        color: { argb: "FF0F172A" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: i >= 3 && i <= 6 ? "left" : "center",
      };
      applyCellBorder(cell);
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
