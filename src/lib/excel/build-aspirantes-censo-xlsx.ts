import ExcelJS from "exceljs";
import {
  calificacionAdmisionEtiqueta,
  sexoEtiqueta,
} from "@/lib/aspirantes/census";

export type AspiranteCensoExportRow = {
  nombres: string;
  apellidos: string;
  unidadPostulante: string;
  calificacionAdmision: string;
  convocatoriaCodigo: string;
  convocatoriaNombre: string;
  convocatoriaActiva: boolean;
  cedula: string;
  sexo: string;
  edad: number;
  fechaNacimiento: Date;
};

export type BuildAspirantesCensoXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
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

function calificacionFill(code: string): ExcelJS.Fill {
  if (code === "APTO") {
    return { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
  }
  if (code === "NO_APTO") {
    return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
  }
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
}

function calificacionFontColor(code: string): ExcelJS.Font["color"] {
  if (code === "APTO") return { argb: "FF065F46" };
  if (code === "NO_APTO") return { argb: "FF991B1B" };
  return { argb: "FF92400E" };
}

function sexoFill(sexo: string): ExcelJS.Fill {
  if (sexo === "FEMENINO") {
    return { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF1F2" } };
  }
  return { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9FF" } };
}

function applyCellBorder(cell: ExcelJS.Cell) {
  cell.border = { ...BORDER };
}

export async function buildAspirantesCensoXlsxBuffer(params: BuildAspirantesCensoXlsxParams): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, generatedAt } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Censo", {
    views: [{ state: "frozen", ySplit: 4, activeCell: "A5", showGridLines: true }],
    properties: { defaultRowHeight: 15 },
  });

  ws.columns = [
    { width: 28 },
    { width: 20 },
    { width: 12 },
    { width: 12 },
    { width: 22 },
    { width: 12 },
    { width: 9 },
    { width: 6 },
    { width: 11 },
  ];

  ws.mergeCells("A1:I1");
  const title = ws.getCell("A1");
  title.value = "CENSO DE ASPIRANTES";
  title.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  title.alignment = { vertical: "middle", horizontal: "center" };
  title.border = BORDER;
  ws.getRow(1).height = 26;

  ws.mergeCells("A2:I2");
  const sub = ws.getCell("A2");
  sub.value = `${convocatoriaNombre}  ·  ${convocatoriaCodigo}  ·  ${anio}  ·  Total: ${rows.length}  ·  Generado: ${generatedAt.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })}`;
  sub.font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };
  sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(sub);
  ws.getRow(2).height = 20;

  ws.mergeCells("A3:I3");
  const hint = ws.getCell("A3");
  hint.value = "Admisión y sexo con sombreado; filas alternadas para lectura rápida.";
  hint.font = { name: "Calibri", size: 8, italic: true, color: { argb: "FF64748B" } };
  hint.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  hint.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  applyCellBorder(hint);
  ws.getRow(3).height = 16;

  const headers = [
    "Nombre completo",
    "Unidad postulante",
    "Admisión",
    "Conv. código",
    "Convocatoria",
    "Cédula",
    "Sexo",
    "Edad",
    "Nacimiento",
  ];
  const headerRow = ws.getRow(4);
  headerRow.height = 18;
  headers.forEach((text, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });

  rows.forEach((r, idx) => {
    const rowNum = 5 + idx;
    const row = ws.getRow(rowNum);
    row.height = 16;
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    const nombre = `${r.nombres} ${r.apellidos}`.trim();
    const convLabel = r.convocatoriaActiva ? `${r.convocatoriaCodigo} (activa)` : r.convocatoriaCodigo;

    const cells: {
      value: string | number;
      align: Partial<ExcelJS.Alignment>;
      fill?: ExcelJS.Fill;
      font?: Partial<ExcelJS.Font>;
    }[] = [
      {
        value: nombre,
        align: { horizontal: "left", vertical: "middle", wrapText: false },
        fill: zebra,
        font: { name: "Calibri", size: 9, bold: true, color: { argb: "FF0F172A" } },
      },
      {
        value: (r.unidadPostulante ?? "").trim() || "—",
        align: { horizontal: "left", vertical: "middle", wrapText: true },
        fill: zebra,
        font: { name: "Calibri", size: 9, color: { argb: "FF1E293B" } },
      },
      {
        value: calificacionAdmisionEtiqueta(r.calificacionAdmision),
        align: { horizontal: "center", vertical: "middle" },
        fill: calificacionFill(r.calificacionAdmision),
        font: { name: "Calibri", size: 9, bold: true, color: calificacionFontColor(r.calificacionAdmision) },
      },
      {
        value: convLabel,
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Consolas", size: 9, color: { argb: "FF475569" } },
      },
      {
        value: r.convocatoriaNombre,
        align: { horizontal: "left", vertical: "middle", wrapText: true },
        fill: zebra,
        font: { name: "Calibri", size: 8, color: { argb: "FF475569" } },
      },
      {
        value: r.cedula,
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Consolas", size: 9, color: { argb: "FF0F172A" } },
      },
      {
        value: sexoEtiqueta(r.sexo),
        align: { horizontal: "center", vertical: "middle" },
        fill: sexoFill(r.sexo),
        font: { name: "Calibri", size: 9, color: { argb: "FF1E293B" } },
      },
      {
        value: r.edad,
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Calibri", size: 9, color: { argb: "FF334155" } },
      },
      {
        value: r.fechaNacimiento.toLocaleDateString("es-VE"),
        align: { horizontal: "center", vertical: "middle" },
        fill: zebra,
        font: { name: "Calibri", size: 9, color: { argb: "FF334155" } },
      },
    ];

    cells.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      cell.value = c.value;
      cell.alignment = { ...c.align, shrinkToFit: i === 0 || i === 1 || i === 4 };
      if (c.fill) cell.fill = c.fill;
      if (c.font) cell.font = { ...cell.font, ...c.font };
      applyCellBorder(cell);
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
