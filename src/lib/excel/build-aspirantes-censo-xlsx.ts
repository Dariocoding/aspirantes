import ExcelJS from "exceljs";
import { sexoEtiqueta } from "@src/lib/aspirantes/census";
import { labelTipoEstudioNivel } from "@src/lib/aspirantes/tipo-estudio";

export type AspiranteCensoExportRow = {
  nombres: string;
  apellidos: string;
  unidadPostulante: string;
  tituloUniversidad: string | null;
  tipoEstudio: string | null;
  cedula: string;
  sexo: string;
  edad: number;
  fechaNacimiento: Date;
};

export type BuildAspirantesCensoXlsxParams = {
  convocatoriaNombre: string;
  anio: number;
  rows: AspiranteCensoExportRow[];
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

const COL_WIDTHS = [34, 28, 34, 14, 12, 8, 13] as const;

function sexoFill(sexo: string): ExcelJS.Fill {
  if (sexo === "FEMENINO") {
    return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF1F2" } };
  }
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9FF" } };
}

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = { ...BORDER };
}

function formatCarreraConNivel(titulo: string | null, tipoEstudio: string | null): string {
  const carrera = (titulo ?? "").trim() || "—";
  if (carrera === "—") return carrera;
  const nivel = labelTipoEstudioNivel(tipoEstudio);
  return nivel ? `${carrera} (${nivel})` : carrera;
}

/** Approx. wrapped lines for ExcelJS (no native autofit). */
function estimateWrappedLines(text: string, colWidth: number): number {
  const charsPerLine = Math.max(8, Math.floor(colWidth * 1.05));
  const parts = text.split(/\r?\n/);
  let lines = 0;
  for (const part of parts) {
    const len = part.trim().length || 1;
    lines += Math.ceil(len / charsPerLine);
  }
  return Math.max(1, lines);
}

function estimateRowHeight(values: string[], colWidths: readonly number[]): number {
  let maxLines = 1;
  values.forEach((v, i) => {
    const w = colWidths[i] ?? 12;
    maxLines = Math.max(maxLines, estimateWrappedLines(v, w));
  });
  return Math.min(72, Math.max(22, 14 + maxLines * 14));
}

export async function buildAspirantesCensoXlsxBuffer(params: BuildAspirantesCensoXlsxParams): Promise<Buffer> {
  const { convocatoriaNombre, anio, rows, generatedAt } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Censo", {
    views: [{ state: "frozen", ySplit: 4, activeCell: "A5", showGridLines: true }],
    properties: { defaultRowHeight: 22 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.columns = COL_WIDTHS.map((width) => ({ width }));

  ws.mergeCells("A1:G1");
  const title = ws.getCell("A1");
  title.value = "CENSO DE ASPIRANTES";
  title.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  title.border = BORDER;
  ws.getRow(1).height = 30;

  ws.mergeCells("A2:G2");
  const sub = ws.getCell("A2");
  sub.value = `${convocatoriaNombre}  ·  ${anio}  ·  Total: ${rows.length}  ·  Generado: ${generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}`;
  sub.font = { name: "Calibri", size: 11, color: { argb: "FF334155" } };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(sub);
  ws.getRow(2).height = 22;

  ws.mergeCells("A3:G3");
  const hint = ws.getCell("A3");
  hint.value =
    "Sexo con sombreado. Puede reeditar este archivo e importarlo: la clave es la cédula (no cree filas nuevas ni cambie cabeceras). Unidad, carrera, sexo y nacimiento se actualizan.";
  hint.font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF64748B" } };
  hint.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  hint.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(hint);
  ws.getRow(3).height = 18;

  const headers = [
    "Nombre completo",
    "Unidad postulante",
    "Carrera",
    "Cédula",
    "Sexo",
    "Edad",
    "Nacimiento",
  ];
  const headerRow = ws.getRow(4);
  headerRow.height = 24;
  headers.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });

  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    const row = ws.getRow(rowNum);
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    const nombre = `${r.nombres} ${r.apellidos}`.trim();
    const unidad = (r.unidadPostulante ?? "").trim() || "—";
    const carrera = formatCarreraConNivel(r.tituloUniversidad, r.tipoEstudio);
    const nacimiento = r.fechaNacimiento.toLocaleDateString("es-VE");

    row.height = estimateRowHeight([nombre, unidad, carrera, "", "", "", ""], COL_WIDTHS);

    const cells: {
      value: string | number;
      align: Partial<ExcelJS.Alignment>;
      fill?: ExcelJS.Fill;
      font?: Partial<ExcelJS.Font>;
    }[] = [
      {
        value: nombre,
        align: { horizontal: "left", vertical: "middle", wrapText: true },
        fill: zebra,
        font: { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } },
      },
      {
        value: unidad,
        align: { horizontal: "left", vertical: "middle", wrapText: true },
        fill: zebra,
        font: { name: "Calibri", size: 11, color: { argb: "FF1E293B" } },
      },
      {
        value: carrera,
        align: { horizontal: "left", vertical: "middle", wrapText: true },
        fill: zebra,
        font: { name: "Calibri", size: 11, color: { argb: "FF1E293B" } },
      },
      {
        value: r.cedula,
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Consolas", size: 11, color: { argb: "FF0F172A" } },
      },
      {
        value: sexoEtiqueta(r.sexo),
        align: { horizontal: "center", vertical: "middle" },
        fill: sexoFill(r.sexo),
        font: { name: "Calibri", size: 11, color: { argb: "FF1E293B" } },
      },
      {
        value: r.edad,
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Calibri", size: 11, color: { argb: "FF334155" } },
      },
      {
        value: nacimiento,
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Calibri", size: 11, color: { argb: "FF334155" } },
      },
    ];

    cells.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.value = c.value;
      cell.alignment = c.align;
      if (c.fill) cell.fill = c.fill;
      if (c.font) cell.font = { ...cell.font, ...c.font };
      applyCellBorder(cell);
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
