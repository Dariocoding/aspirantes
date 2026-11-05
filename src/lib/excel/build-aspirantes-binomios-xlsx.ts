import ExcelJS from "exceljs";
import {
  agruparFilasBinomio,
  type AspiranteParaBinomio,
} from "@src/lib/aspirantes/binomio";
import { sexoEtiqueta } from "@src/lib/aspirantes/census";
import { applyExcelMembreteHeader } from "@src/lib/excel/apply-excel-membrete";
import type { MembreteSpec } from "@src/lib/membrete";

export type AspiranteBinomioExportRow = AspiranteParaBinomio;

export type BuildAspirantesBinomiosXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  rows: AspiranteBinomioExportRow[];
  generatedAt: Date;
  membrete?: MembreteSpec | null;
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
const SOLO_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFF7ED" } };

const HEADERS = ["N°", "BINOMIO", "CÓDIGO", "NOMBRE", "CÉDULA", "PELOTÓN", "SEXO"] as const;

const COL_WIDTHS = [6, 12, 12, 42, 16, 16, 14] as const;
const LAST_COL = HEADERS.length;

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = BORDER;
}

function nombreCompleto(r: AspiranteBinomioExportRow): string {
  return `${r.nombres} ${r.apellidos}`.trim().toUpperCase();
}

export async function buildAspirantesBinomiosXlsxBuffer(
  params: BuildAspirantesBinomiosXlsxParams,
): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, generatedAt } = params;
  const { parejas, sinCodigo } = agruparFilasBinomio(rows);

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Binomios", {
    properties: { defaultRowHeight: 20 },
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9,
    },
  });

  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  const offset = applyExcelMembreteHeader(wb, ws, LAST_COL, params.membrete);
  let rowNum = offset + 1;

  ws.mergeCells(rowNum, 1, rowNum, LAST_COL);
  const title = ws.getCell(rowNum, 1);
  title.value = `BINOMIOS / CAZARES — ${convocatoriaNombre} (${convocatoriaCodigo}) · ${anio}`;
  title.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF0F172A" } };
  title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(rowNum).height = 24;
  rowNum += 1;

  ws.mergeCells(rowNum, 1, rowNum, LAST_COL);
  const sub = ws.getCell(rowNum, 1);
  sub.value = `Parejas: ${parejas.length} · Sin código: ${sinCodigo.length} · Generado: ${generatedAt.toLocaleString("es-VE")}`;
  sub.font = { name: "Calibri", size: 10, color: { argb: "FF64748B" } };
  ws.getRow(rowNum).height = 18;
  rowNum += 2;

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
  rowNum += 1;

  let idx = 0;
  for (const fila of parejas) {
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    const personas = [fila.p1, fila.p2].filter((p): p is NonNullable<typeof fila.p1> => p != null);
    const solo = personas.length < 2;
    const fill = solo ? SOLO_FILL : zebra;
    const inicio = rowNum;

    personas.forEach((persona, personaIdx) => {
      const row = ws.getRow(rowNum);
      const values: Array<string | number> = [
        personaIdx === 0 ? idx + 1 : "",
        personaIdx === 0 ? fila.clave : "",
        persona.codigo,
        persona.nombre,
        persona.cedula,
        personaIdx === 0 ? fila.pelotonLabel : "",
        personaIdx === 0 ? fila.sexo : "",
      ];
      values.forEach((value, i) => {
        const cell = row.getCell(i + 1);
        cell.value = value;
        cell.fill = fill;
        cell.font = {
          name: i === 2 || i === 4 ? "Consolas" : "Calibri",
          size: 11,
          bold: i === 1,
          color: { argb: "FF0F172A" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: i === 3 ? "left" : "center",
        };
        applyCellBorder(cell);
      });
      rowNum += 1;
    });

    if (personas.length === 2) {
      for (const col of [1, 2, 6, 7]) {
        ws.mergeCells(inicio, col, inicio + 1, col);
        ws.getCell(inicio, col).alignment = { vertical: "middle", horizontal: "center" };
      }
    }

    idx += 1;
  }

  if (sinCodigo.length) {
    rowNum += 1;
    ws.mergeCells(rowNum, 1, rowNum, LAST_COL);
    const banner = ws.getCell(rowNum, 1);
    banner.value = "SIN CÓDIGO DE BINOMIO";
    banner.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    banner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF64748B" } };
    banner.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    for (let c = 1; c <= LAST_COL; c++) {
      applyCellBorder(ws.getCell(rowNum, c));
      ws.getCell(rowNum, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF64748B" } };
    }
    ws.getRow(rowNum).height = 22;
    rowNum += 1;

    for (const r of sinCodigo) {
      const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
      const row = ws.getRow(rowNum);
      const values: Array<string | number> = [
        idx + 1,
        "",
        "",
        nombreCompleto(r),
        r.cedula,
        r.pelotonLabel?.trim() || "—",
        sexoEtiqueta(r.sexo),
      ];
      values.forEach((value, i) => {
        const cell = row.getCell(i + 1);
        cell.value = value;
        cell.fill = zebra;
        cell.font = { name: i === 4 ? "Consolas" : "Calibri", size: 11, color: { argb: "FF0F172A" } };
        cell.alignment = { vertical: "middle", horizontal: i === 3 ? "left" : "center" };
        applyCellBorder(cell);
      });
      idx += 1;
      rowNum += 1;
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
