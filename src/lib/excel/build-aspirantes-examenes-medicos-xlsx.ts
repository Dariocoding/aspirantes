import ExcelJS from "exceljs";
import {
  EXAMEN_MEDICO_ITEMS,
  parseFichaEvaluacion,
} from "@src/lib/aspirantes/ficha-evaluacion";

export type AspiranteExamenesMedicosExportRow = {
  nombres: string;
  apellidos: string;
  cedula: string;
  estaturaCm: number | null;
  pesoKg: number | null;
  tensionArterial: string | null;
  fichaEvaluacion: unknown;
};

export type BuildAspirantesExamenesMedicosXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  rows: AspiranteExamenesMedicosExportRow[];
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
const SI_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFD1FAE5" } };

const FISICO_HEADERS = ["Peso (kg)", "Estatura (cm)", "Tensión"] as const;
const FISICO_COL_COUNT = FISICO_HEADERS.length;

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = BORDER;
}

function formatOptionalNumber(value: number | null | undefined): string | number {
  if (value == null || Number.isNaN(value)) return "";
  return value;
}

export async function buildAspirantesExamenesMedicosXlsxBuffer(
  params: BuildAspirantesExamenesMedicosXlsxParams,
): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, generatedAt } = params;

  const examenHeaders = EXAMEN_MEDICO_ITEMS.map((item) => item.texto);
  const colCount = 2 + FISICO_COL_COUNT + examenHeaders.length;
  const lastCol = colCount;
  const examStartCol = 3 + FISICO_COL_COUNT;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Exámenes médicos", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 2, activeCell: "A5", showGridLines: true }],
    properties: { defaultRowHeight: 22 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.getColumn(1).width = 36;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 12;
  for (let i = 0; i < examenHeaders.length; i++) {
    ws.getColumn(examStartCol + i).width = Math.min(22, Math.max(12, examenHeaders[i]!.length * 0.85));
  }

  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = "EXÁMENES MÉDICOS — ASPIRANTES";
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  applyCellBorder(title);
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, lastCol);
  const sub = ws.getCell(2, 1);
  sub.value = `${convocatoriaNombre}  ·  ${convocatoriaCodigo}  ·  ${anio}  ·  Total: ${rows.length}  ·  Generado: ${generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}`;
  sub.font = { name: "Calibri", size: 11, color: { argb: "FF334155" } };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(sub);
  ws.getRow(2).height = 22;

  ws.mergeCells(3, 1, 3, lastCol);
  const hint = ws.getCell(3, 1);
  hint.value =
    "Peso, estatura y tensión desde datos físicos. SI = examen realizado; vacío = no. Puede reeditar este archivo e importarlo: clave = cédula (sin filas nuevas ni cambiar cabeceras).";
  hint.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF64748B" } };
  hint.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  hint.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(hint);
  ws.getRow(3).height = 18;

  const headers = ["Nombre completo", "Cédula", ...FISICO_HEADERS, ...examenHeaders];
  const headerRow = ws.getRow(4);
  headerRow.height = 36;
  headers.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });

  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    const row = ws.getRow(rowNum);
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    const nombre = `${r.nombres} ${r.apellidos}`.trim();
    const ficha = parseFichaEvaluacion(r.fichaEvaluacion);

    row.height = 22;

    const nombreCell = row.getCell(1);
    nombreCell.value = nombre;
    nombreCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    nombreCell.fill = zebra;
    nombreCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
    applyCellBorder(nombreCell);

    const cedulaCell = row.getCell(2);
    cedulaCell.value = r.cedula;
    cedulaCell.alignment = { horizontal: "center", vertical: "middle" };
    cedulaCell.fill = zebra;
    cedulaCell.font = { name: "Consolas", size: 11, color: { argb: "FF0F172A" } };
    applyCellBorder(cedulaCell);

    const fisicoValues: Array<string | number> = [
      formatOptionalNumber(r.pesoKg),
      formatOptionalNumber(r.estaturaCm),
      (r.tensionArterial ?? "").trim(),
    ];
    fisicoValues.forEach((value, i) => {
      const cell = row.getCell(3 + i);
      cell.value = value;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = zebra;
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF1E293B" } };
      applyCellBorder(cell);
    });

    EXAMEN_MEDICO_ITEMS.forEach((item, examIdx) => {
      const cell = row.getCell(examStartCol + examIdx);
      const marcado = ficha.examenMedico[item.id]?.si === true;
      cell.value = marcado ? "SI" : "";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = marcado ? SI_FILL : zebra;
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: marcado,
        color: { argb: marcado ? "FF065F46" : "FF334155" },
      };
      applyCellBorder(cell);
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
