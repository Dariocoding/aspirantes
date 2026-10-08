import ExcelJS from "exceljs";
import {
  examenIdFromExportColumn,
  getCensusExportColumn,
  isExamExportColumnId,
  withContactoTelefonoColumn,
  type CensusExportColumn,
} from "@src/lib/aspirantes/census-export-columns";
import { formatTelefonoVenezolano } from "@src/lib/aspirantes/telefono";
import { calificacionAdmisionEtiqueta, sexoEtiqueta } from "@src/lib/aspirantes/census";
import { parseFichaEvaluacion } from "@src/lib/aspirantes/ficha-evaluacion";
import { labelEstadoCivil } from "@src/lib/aspirantes/estado-civil";
import { labelCondicionMilitar } from "@src/lib/aspirantes/condicion-militar";
import {
  abrevJerarquiaAspirante,
  labelJerarquiaAspirante,
} from "@src/lib/aspirantes/jerarquia-aspirante";
import { labelTipoEstudioNivel } from "@src/lib/aspirantes/tipo-estudio";
import { formatTipoSangreHomologado } from "@src/lib/aspirantes/senaletica";
import { TALLA_UNIFORME_PATRIOTA_LABELS, isTallaUniformePatriota } from "@src/lib/aspirantes/tallas-familia";
import { applyExcelMembreteHeader } from "@src/lib/excel/apply-excel-membrete";
import type { MembreteSpec } from "@src/lib/membrete";

export type AspiranteCensoExportRow = {
  nombres: string;
  apellidos: string;
  unidadPostulante: string;
  condicionMilitar: string | null;
  jerarquia: string;
  tituloUniversidad: string | null;
  tipoEstudio: string | null;
  cedula: string;
  carnetPatriaCodigo: string | null;
  carnetPatriaSerial: string | null;
  cuentaNominaBanfanb: string | null;
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
  tallaUniformePatriota: string | null;
  fichaEvaluacion: unknown;
};

export type BuildAspirantesCensoXlsxParams = {
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  anio: number;
  rows: AspiranteCensoExportRow[];
  columnIds: string[];
  generatedAt: Date;
  membrete?: MembreteSpec | null;
  /** Título escrito en la hoja, debajo del membrete y encima de las columnas. */
  titulo?: string | null;
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

function formatTelefonoExport(raw: string | null | undefined): string {
  const formatted = formatTelefonoVenezolano(raw);
  return formatted?.trim() ? formatted : "—";
}

function formatContacto(r: AspiranteCensoExportRow): string {
  const nombre = r.contactoNombre?.trim();
  const parentesco = r.contactoParentesco?.trim();
  const tel = formatTelefonoVenezolano(r.contactoTelefono);
  const parts = [nombre, parentesco, tel].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
}

/** Con 5 columnas o menos el membrete se queda angosto: se estira según el texto. */
const FEW_COLUMNS = 5;

function longestLine(text: string): number {
  return text.split(/\r?\n/).reduce((max, part) => Math.max(max, part.trim().length), 0);
}

function columnWidths(
  columns: CensusExportColumn[],
  rows: AspiranteCensoExportRow[],
  membrete: MembreteSpec | null | undefined,
  titulo: string,
): number[] {
  const samples = columns.map((col) =>
    rows.slice(0, 80).map((row, index) => String(cellValue(col, row, index))),
  );
  const base = columns.map((col, index) => {
    const longest = samples[index]!.reduce((max, text) => Math.max(max, longestLine(text)), col.label.length);
    if (columns.length > FEW_COLUMNS) return col.width;
    const fitted = Math.ceil(longest * 1.08 + 2);
    return Math.max(col.width, Math.min(fitted, 40));
  });
  if (columns.length > FEW_COLUMNS) return base;

  const longestMembrete = membrete?.lineas.reduce((max, line) => Math.max(max, line.trim().length), 0) ?? 0;
  const hasLogo = Boolean(membrete && (membrete.logoIzq !== "none" || membrete.logoDer !== "none"));
  const longestText = Math.max(longestMembrete, titulo.length);
  if (!longestText && !hasLogo) return base;

  const flanked = columns.length >= FEW_COLUMNS && hasLogo;
  const textGoal = Math.ceil(Math.max(longestText, 42) / 2);
  const logoGoal = flanked ? 24 : hasLogo ? 6 : 0;
  const target = Math.max(68, textGoal + logoGoal);

  const weights = columns.map((col, index) => {
    const content = samples[index]!.reduce(
      (max, text) => Math.max(max, Math.min(longestLine(text.split(/\r?\n/)[0] ?? ""), 32)),
      col.label.length,
    );
    const side = flanked && (index === 0 || index === columns.length - 1);
    return Math.max(2, side ? content * 0.4 : content);
  });

  const next = [...base];
  if (flanked) {
    next[0] = Math.max(next[0] ?? 0, 12);
    next[next.length - 1] = Math.max(next[next.length - 1] ?? 0, 12);
  }
  const deficit = target - next.reduce((sum, width) => sum + width, 0);
  if (deficit <= 0.5) return next.map((width) => Math.round(width * 10) / 10);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  return next.map((width, index) => Math.round((width + (deficit * weights[index]!) / weightSum) * 10) / 10);
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
    case "carnetPatriaCodigo":
      return dash(r.carnetPatriaCodigo);
    case "carnetPatriaSerial":
      return dash(r.carnetPatriaSerial);
    case "cuentaNominaBanfanb":
      return dash(r.cuentaNominaBanfanb);
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
    case "condicion":
      return dash(labelCondicionMilitar(r.condicionMilitar) ?? undefined);
    case "jerarquia":
      return dash(`${abrevJerarquiaAspirante(r.jerarquia)} · ${labelJerarquiaAspirante(r.jerarquia)}`);
    case "carrera":
      return formatCarreraConNivel(r.tituloUniversidad, r.tipoEstudio);
    case "calificacion":
      return calificacionAdmisionEtiqueta(r.calificacionAdmision);
    case "peloton":
      return dash(r.pelotonLabel);
    case "telefono":
      return formatTelefonoExport(r.telefono);
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
    case "contactoTelefono":
      return formatTelefonoExport(r.contactoTelefono);
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
    case "tallaUniformePatriota":
      return dash(
        isTallaUniformePatriota(r.tallaUniformePatriota)
          ? TALLA_UNIFORME_PATRIOTA_LABELS[r.tallaUniformePatriota]
          : r.tallaUniformePatriota,
      );
    default:
      return "";
  }
}

export async function buildAspirantesCensoXlsxBuffer(params: BuildAspirantesCensoXlsxParams): Promise<Buffer> {
  const { rows, generatedAt } = params;
  const columnIds = withContactoTelefonoColumn(params.columnIds);
  const columns = columnIds.map((id) => getCensusExportColumn(id)).filter((c): c is CensusExportColumn => Boolean(c));
  if (!columns.length) {
    throw new Error("Seleccione al menos una columna para exportar.");
  }

  const lastCol = columns.length;
  const titulo = params.titulo?.replace(/\s+/g, " ").trim().slice(0, 180) ?? "";
  const widths = columnWidths(columns, rows, params.membrete ?? null, titulo);
  const wb = new ExcelJS.Workbook();
  wb.creator = "FANB Aspirantes";
  wb.created = generatedAt;

  const ws = wb.addWorksheet("Censo", {
    properties: { defaultRowHeight: 20 },
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    },
  });

  columns.forEach((col, i) => {
    const column = ws.getColumn(i + 1);
    column.width = widths[i];
    column.font = { name: "Arial", size: 12, bold: false, color: { argb: "FF0F172A" } };
  });

  const offset = applyExcelMembreteHeader(wb, ws, lastCol, params.membrete);
  const titleRows = titulo ? 1 : 0;
  if (titulo) {
    const titleRow = offset + 1;
    if (lastCol > 1) ws.mergeCells(titleRow, 1, titleRow, lastCol);
    const titleFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF1F5F9" } };
    for (let c = 1; c <= lastCol; c++) {
      const side = ws.getCell(titleRow, c);
      side.fill = titleFill;
      applyCellBorder(side);
    }
    const title = ws.getCell(titleRow, 1);
    title.value = titulo;
    title.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF0F172A" } };
    title.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    const chars = Math.max(18, Math.floor(widths.reduce((sum, width) => sum + width, 0) * 1.05));
    const lines = Math.max(1, Math.ceil(titulo.length / chars));
    ws.getRow(titleRow).height = Math.min(48, Math.max(26, lines * 18));
  }
  const colHeaderRow = offset + titleRows + 1;
  const dataStartRow = offset + titleRows + 2;

  // El membrete va encima y se desplaza. La tabla deja fijos solo los encabezados al hacer scroll.
  if (rows.length > 0) {
    ws.addTable({
      name: "Censo",
      ref: `A${colHeaderRow}`,
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleLight1", showRowStripes: false },
      columns: columns.map((col) => ({ name: col.label, filterButton: false })),
      rows: rows.map((row, idx) => columns.map((col) => cellValue(col, row, idx))),
    });
  }
  ws.pageSetup.printTitlesRow = `${colHeaderRow}:${colHeaderRow}`;

  const headerRow = ws.getRow(colHeaderRow);
  headerRow.height = 22;
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.label;
    cell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    applyCellBorder(cell);
  });

  rows.forEach((r, idx) => {
    const row = ws.getRow(dataStartRow + idx);
    const zebra = idx % 2 === 0 ? ZEBRA_A : ZEBRA_B;
    let maxLines = 1;

    columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      const value = cellValue(col, r, idx);
      const examSi = isExamExportColumnId(col.id) && value === "SI";
      if (col.id === "tipoSangre") {
        const text = String(value);
        cell.numFmt = "@";
        cell.value = { richText: [{ font: { name: "Arial", size: 12, bold: true }, text }] };
      } else if (col.id === "telefono" || col.id === "contactoTelefono") {
        cell.numFmt = "@";
        cell.value = String(value);
      } else if (col.id === "estatura" && typeof value === "number") {
        cell.numFmt = "0.00";
        cell.value = value;
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
      if (col.id !== "tipoSangre") {
        cell.font = {
          name: "Arial",
          size: 12,
          bold: false,
          color: { argb: examSi ? "FF065F46" : "FF0F172A" },
        };
      }
      applyCellBorder(cell);
      if (typeof value === "string" && col.align === "left") {
        maxLines = Math.max(maxLines, estimateWrappedLines(value, widths[i] ?? col.width));
      }
    });

    row.height = Math.min(72, Math.max(22, 14 + maxLines * 14));
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
