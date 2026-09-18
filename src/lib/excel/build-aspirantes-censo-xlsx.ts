import ExcelJS from "exceljs";
import {
  examenIdFromExportColumn,
  getCensusExportColumn,
  isExamExportColumnId,
  type CensusExportColumn,
} from "@src/lib/aspirantes/census-export-columns";
import { calificacionAdmisionEtiqueta, sexoEtiqueta } from "@src/lib/aspirantes/census";
import { parseFichaEvaluacion } from "@src/lib/aspirantes/ficha-evaluacion";
import { labelEstadoCivil } from "@src/lib/aspirantes/estado-civil";
import { labelTipoEstudioNivel } from "@src/lib/aspirantes/tipo-estudio";
import { formatTipoSangreHomologado } from "@src/lib/aspirantes/senaletica";

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
  lugarNacimiento: string;
  calificacionAdmision: string;
  pelotonLabel: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  estadoCivil: string | null;
  religion: string | null;
  deporte: string | null;
  hijosCantidad: number;
  nombreUniversidad: string | null;
  paisUniversidad: string | null;
  contactoNombre: string | null;
  contactoParentesco: string | null;
  contactoTelefono: string | null;
  estaturaCm: number | null;
  pesoKg: number | null;
  tipoSangre: string | null;
  factorRh: string | null;
  tensionArterial: string | null;
  alergias: string | null;
  condicionesMedicas: string | null;
  discapacidad: string | null;
  observaciones: string | null;
  tallaGorra: string | null;
  tallaCamisa: string | null;
  tallaPantalon: string | null;
  tallaCalzado: string | null;
  fichaEvaluacion: unknown;
};

export type BuildAspirantesCensoXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  rows: AspiranteCensoExportRow[];
  columnIds: string[];
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

function dash(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : "—";
}

function optionalNumber(value: number | null | undefined): string | number {
  if (value == null || Number.isNaN(value)) return "—";
  return value;
}

function formatContacto(r: AspiranteCensoExportRow): string {
  const nombre = r.contactoNombre?.trim();
  const parentesco = r.contactoParentesco?.trim();
  const tel = r.contactoTelefono?.trim();
  const parts = [nombre, parentesco, tel].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

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

function cellValue(
  col: CensusExportColumn,
  r: AspiranteCensoExportRow,
  index: number,
): string | number {
  if (isExamExportColumnId(col.id)) {
    const examenId = examenIdFromExportColumn(col.id);
    if (!examenId) return "";
    const ficha = parseFichaEvaluacion(r.fichaEvaluacion);
    return ficha.examenMedico[examenId]?.si === true ? "SI" : "";
  }

  switch (col.id) {
    case "numero":
      return index + 1;
    case "nombreCompleto":
      return `${r.nombres} ${r.apellidos}`.trim();
    case "nombres":
      return r.nombres.trim();
    case "apellidos":
      return r.apellidos.trim();
    case "cedula":
      return r.cedula;
    case "sexo":
      return sexoEtiqueta(r.sexo);
    case "edad":
      return r.edad;
    case "nacimiento":
      return r.fechaNacimiento.toLocaleDateString("es-VE");
    case "lugarNacimiento":
      return dash(r.lugarNacimiento);
    case "unidad":
      return dash(r.unidadPostulante);
    case "carrera":
      return formatCarreraConNivel(r.tituloUniversidad, r.tipoEstudio);
    case "calificacion":
      return calificacionAdmisionEtiqueta(r.calificacionAdmision);
    case "peloton":
      return dash(r.pelotonLabel);
    case "telefono":
      return dash(r.telefono);
    case "correo":
      return dash(r.correo);
    case "direccion":
      return dash(r.direccion);
    case "estadoCivil":
      return dash(labelEstadoCivil(r.estadoCivil) ?? undefined);
    case "religion":
      return dash(r.religion);
    case "deporte":
      return dash(r.deporte);
    case "hijos":
      return r.hijosCantidad;
    case "contactoEmergencia":
      return formatContacto(r);
    case "universidad":
      return dash(r.nombreUniversidad);
    case "paisUniversidad":
      return dash(r.paisUniversidad);
    case "tipoSangre":
      return formatTipoSangreHomologado(r.tipoSangre, r.factorRh) ?? "—";
    case "estatura":
      return optionalNumber(r.estaturaCm);
    case "peso":
      return optionalNumber(r.pesoKg);
    case "tension":
      return dash(r.tensionArterial);
    case "alergias":
      return dash(r.alergias);
    case "condicionesMedicas":
      return dash(r.condicionesMedicas);
    case "discapacidad":
      return dash(r.discapacidad);
    case "observaciones":
      return dash(r.observaciones);
    case "tallaGorra":
      return dash(r.tallaGorra);
    case "tallaCamisa":
      return dash(r.tallaCamisa);
    case "tallaPantalon":
      return dash(r.tallaPantalon);
    case "tallaCalzado":
      return dash(r.tallaCalzado);
    default:
      return "";
  }
}

export async function buildAspirantesCensoXlsxBuffer(params: BuildAspirantesCensoXlsxParams): Promise<Buffer> {
  const { convocatoriaNombre, convocatoriaCodigo, anio, rows, columnIds, generatedAt } = params;
  const columns = columnIds.map((id) => getCensusExportColumn(id)).filter((c): c is CensusExportColumn => Boolean(c));
  if (!columns.length) {
    throw new Error("Seleccione al menos una columna para exportar.");
  }

  const lastCol = columns.length;
  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Censo", {
    views: [{ state: "frozen", ySplit: 3, xSplit: 0, activeCell: "A4", showGridLines: true }],
    properties: { defaultRowHeight: 22 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = "CENSO DE ASPIRANTES";
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

  const headerRow = ws.getRow(3);
  headerRow.height = 28;
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.label;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });

  rows.forEach((r, idx) => {
    const row = ws.getRow(4 + idx);
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    let maxLines = 1;

    columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      const value = cellValue(col, r, idx);
      const examSi = isExamExportColumnId(col.id) && value === "SI";
      if (col.id === "tipoSangre") {
        const text = String(value);
        cell.numFmt = "@";
        cell.value = { richText: [{ font: { name: "Calibri", size: 11, bold: true }, text }] };
      } else {
        cell.value = value;
      }
      cell.alignment = {
        vertical: "middle",
        horizontal: col.align,
        wrapText: col.align === "left",
      };
      if (col.id === "sexo") {
        cell.fill = sexoFill(r.sexo);
      } else if (examSi) {
        cell.fill = SI_FILL;
      } else {
        cell.fill = zebra;
      }
      const mono = col.id === "cedula" || col.id === "numero" || col.id === "telefono";
      if (col.id !== "tipoSangre") {
        cell.font = {
          name: mono ? "Consolas" : "Calibri",
          size: 11,
          bold: col.id === "nombreCompleto" || examSi,
          color: { argb: examSi ? "FF065F46" : "FF0F172A" },
        };
      }
      applyCellBorder(cell);
      if (typeof value === "string" && col.align === "left") {
        maxLines = Math.max(maxLines, estimateWrappedLines(value, col.width));
      }
    });

    row.height = Math.min(72, Math.max(22, 14 + maxLines * 14));
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
