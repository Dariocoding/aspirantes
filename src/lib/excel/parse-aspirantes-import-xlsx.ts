import ExcelJS from "exceljs";
import { EXAMEN_MEDICO_ITEMS } from "@src/lib/aspirantes/ficha-evaluacion";

export type ImportVariant = "censo" | "examenes-medicos";

export type CensoImportRow = {
  rowNumber: number;
  cedula: string;
  unidadPostulante?: string;
  tituloUniversidad?: string | null;
  calificacionAdmision?: "APTO" | "NO_APTO" | "EN_EVALUACION";
  sexo?: "MASCULINO" | "FEMENINO";
  fechaNacimiento?: Date;
};

export type ExamenesImportRow = {
  rowNumber: number;
  cedula: string;
  pesoKg?: number | null;
  estaturaCm?: number | null;
  tensionArterial?: string | null;
  /** true = SI; false = vacío / no marcado */
  examenes: Record<string, boolean>;
};

export type ParseImportOk =
  | { ok: true; variant: "censo"; rows: CensoImportRow[] }
  | { ok: true; variant: "examenes-medicos"; rows: ExamenesImportRow[] };

export type ParseImportErr = {
  ok: false;
  error: string;
};

export type ParseImportResult = ParseImportOk | ParseImportErr;

const CENSO_HEADERS = [
  "Nombre completo",
  "Unidad postulante",
  "Carrera",
  "Admisión",
  "Conv. código",
  "Convocatoria",
  "Cédula",
  "Sexo",
  "Edad",
  "Nacimiento",
] as const;

const EXAM_BASE_HEADERS = ["Nombre completo", "Cédula", "Peso (kg)", "Estatura (cm)", "Tensión"] as const;

function cellText(value: ExcelJS.CellValue): string {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("es-VE");
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((p) => p.text ?? "").join("").trim();
    }
  }
  return String(value).trim();
}

function normalizeHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function headersMatch(actual: string[], expected: readonly string[]): boolean {
  if (actual.length < expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (normalizeHeader(actual[i] ?? "") !== normalizeHeader(expected[i]!)) return false;
  }
  return true;
}

/** Normaliza cédula: solo dígitos (Excel a veces la guarda como número). */
export function normalizeCedulaDigits(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(Math.trunc(raw));
  }
  const s = String(raw).trim();
  if (/^\d+\.0+$/.test(s)) return s.replace(/\.0+$/, "");
  return s.replace(/\D/g, "");
}

function dashToEmpty(s: string): string {
  const t = s.trim();
  if (!t || t === "—" || t === "-" || t === "–") return "";
  return t;
}

function parseCalificacion(label: string): "APTO" | "NO_APTO" | "EN_EVALUACION" | null {
  const n = normalizeHeader(label);
  if (n === "apto") return "APTO";
  if (n === "no apto") return "NO_APTO";
  if (n === "en evaluacion") return "EN_EVALUACION";
  if (n === "apto" || n === "ap") return "APTO";
  return null;
}

function parseSexo(label: string): "MASCULINO" | "FEMENINO" | null {
  const n = normalizeHeader(label);
  if (n === "femenino" || n === "f") return "FEMENINO";
  if (n === "masculino" || n === "m") return "MASCULINO";
  return null;
}

function parseDateEsVe(value: ExcelJS.CellValue): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date (ExcelJS usually gives Date, but be safe)
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + value * 86400000);
    if (!Number.isNaN(d.getTime())) {
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
  }
  const s = cellText(value);
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) return d;
  }
  const iso = new Date(s);
  if (!Number.isNaN(iso.getTime())) {
    return new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
  }
  return null;
}

function parseOptionalFloat(value: ExcelJS.CellValue, max: number): number | null | undefined {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value < 0 || value > max) return undefined;
    return value;
  }
  const s = dashToEmpty(cellText(value));
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > max) return undefined;
  return n;
}

function isSiMark(value: ExcelJS.CellValue): boolean {
  const s = normalizeHeader(cellText(value));
  return s === "si" || s === "s" || s === "x" || s === "1" || s === "true" || s === "yes";
}

function readHeaderRow(ws: ExcelJS.Worksheet, rowNumber: number): string[] {
  const row = ws.getRow(rowNumber);
  const values: string[] = [];
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    while (values.length < col - 1) values.push("");
    values[col - 1] = cellText(cell.value);
  });
  return values.map((v) => v ?? "");
}

function detectVariant(headers: string[]): ImportVariant | null {
  const examHeaders = [...EXAM_BASE_HEADERS, ...EXAMEN_MEDICO_ITEMS.map((i) => i.texto)];
  if (headersMatch(headers, examHeaders)) return "examenes-medicos";
  if (headersMatch(headers, CENSO_HEADERS)) return "censo";
  // Tolerar exámenes si al menos base + mismos textos de examen (orden)
  if (headersMatch(headers, EXAM_BASE_HEADERS)) {
    const examOk = EXAMEN_MEDICO_ITEMS.every((item, i) => {
      const h = headers[EXAM_BASE_HEADERS.length + i];
      return h != null && normalizeHeader(h) === normalizeHeader(item.texto);
    });
    if (examOk) return "examenes-medicos";
  }
  return null;
}

function findDataSheet(wb: ExcelJS.Workbook): ExcelJS.Worksheet | null {
  const byName =
    wb.getWorksheet("Censo") ??
    wb.getWorksheet("Exámenes médicos") ??
    wb.getWorksheet("Examenes medicos");
  if (byName) return byName;
  return wb.worksheets[0] ?? null;
}

/**
 * Lee un .xlsx exportado por el sistema (censo o exámenes médicos).
 * Cabeceras en fila 4; datos desde fila 5. Clave: cédula.
 */
export async function parseAspirantesImportXlsx(buffer: ArrayBuffer | Buffer): Promise<ParseImportResult> {
  const wb = new ExcelJS.Workbook();
  // ExcelJS tipa Buffer de Node; ArrayBuffer también funciona en runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as any);

  const ws = findDataSheet(wb);
  if (!ws) {
    return { ok: false, error: "El archivo Excel no contiene hojas de datos." };
  }

  const headers = readHeaderRow(ws, 4);
  const variant = detectVariant(headers);
  if (!variant) {
    return {
      ok: false,
      error:
        "No se reconoció el formato. Use el Excel exportado desde Censo (completo o exámenes médicos) sin cambiar las cabeceras de la fila 4.",
    };
  }

  if (variant === "censo") {
    const rows: CensoImportRow[] = [];
    const seen = new Set<string>();

    for (let r = 5; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const cedula = normalizeCedulaDigits(row.getCell(7).value);
      if (!cedula) {
        // Fila vacía (sin cédula): ignorar si toda la fila está vacía
        const nombre = cellText(row.getCell(1).value);
        if (!nombre) continue;
        return {
          ok: false,
          error: `Fila ${r}: falta la cédula (columna Cédula).`,
        };
      }
      if (!/^[0-9]{6,12}$/.test(cedula)) {
        return { ok: false, error: `Fila ${r}: cédula inválida "${cedula}" (solo dígitos, 6–12).` };
      }
      if (seen.has(cedula)) {
        return { ok: false, error: `Fila ${r}: cédula duplicada en el archivo (${cedula}).` };
      }
      seen.add(cedula);

      const unidadRaw = dashToEmpty(cellText(row.getCell(2).value));
      const carreraRaw = dashToEmpty(cellText(row.getCell(3).value));
      const admLabel = cellText(row.getCell(4).value);
      const sexoLabel = cellText(row.getCell(8).value);
      const fechaCell = row.getCell(10).value;

      const parsed: CensoImportRow = { rowNumber: r, cedula };

      parsed.unidadPostulante = unidadRaw;
      parsed.tituloUniversidad = carreraRaw ? carreraRaw.slice(0, 200) : null;

      if (admLabel) {
        const cal = parseCalificacion(admLabel);
        if (!cal) {
          return {
            ok: false,
            error: `Fila ${r}: admisión no válida "${admLabel}" (use Apto, No apto o En evaluación).`,
          };
        }
        parsed.calificacionAdmision = cal;
      }

      if (sexoLabel) {
        const sexo = parseSexo(sexoLabel);
        if (!sexo) {
          return { ok: false, error: `Fila ${r}: sexo no válido "${sexoLabel}" (Masculino o Femenino).` };
        }
        parsed.sexo = sexo;
      }

      if (fechaCell != null && cellText(fechaCell) !== "") {
        const fecha = parseDateEsVe(fechaCell);
        if (!fecha) {
          return {
            ok: false,
            error: `Fila ${r}: fecha de nacimiento inválida (use DD/MM/AAAA).`,
          };
        }
        parsed.fechaNacimiento = fecha;
      }

      rows.push(parsed);
    }

    if (!rows.length) {
      return { ok: false, error: "El Excel no tiene filas de datos para importar." };
    }
    return { ok: true, variant: "censo", rows };
  }

  // examenes-medicos
  const rows: ExamenesImportRow[] = [];
  const seen = new Set<string>();
  const examStartCol = EXAM_BASE_HEADERS.length + 1; // 1-based: col 6

  for (let r = 5; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cedula = normalizeCedulaDigits(row.getCell(2).value);
    if (!cedula) {
      const nombre = cellText(row.getCell(1).value);
      if (!nombre) continue;
      return { ok: false, error: `Fila ${r}: falta la cédula.` };
    }
    if (!/^[0-9]{6,12}$/.test(cedula)) {
      return { ok: false, error: `Fila ${r}: cédula inválida "${cedula}" (solo dígitos, 6–12).` };
    }
    if (seen.has(cedula)) {
      return { ok: false, error: `Fila ${r}: cédula duplicada en el archivo (${cedula}).` };
    }
    seen.add(cedula);

    const peso = parseOptionalFloat(row.getCell(3).value, 400);
    if (peso === undefined) {
      return { ok: false, error: `Fila ${r}: peso inválido.` };
    }
    const estatura = parseOptionalFloat(row.getCell(4).value, 300);
    if (estatura === undefined) {
      return { ok: false, error: `Fila ${r}: estatura inválida.` };
    }
    const tensionRaw = dashToEmpty(cellText(row.getCell(5).value));
    if (tensionRaw.length > 20) {
      return { ok: false, error: `Fila ${r}: tensión arterial demasiado larga.` };
    }

    const examenes: Record<string, boolean> = {};
    EXAMEN_MEDICO_ITEMS.forEach((item, i) => {
      examenes[item.id] = isSiMark(row.getCell(examStartCol + i).value);
    });

    rows.push({
      rowNumber: r,
      cedula,
      pesoKg: peso,
      estaturaCm: estatura,
      tensionArterial: tensionRaw ? tensionRaw : null,
      examenes,
    });
  }

  if (!rows.length) {
    return { ok: false, error: "El Excel no tiene filas de datos para importar." };
  }
  return { ok: true, variant: "examenes-medicos", rows };
}

export { ageFromBirthDate } from "@src/lib/date";
