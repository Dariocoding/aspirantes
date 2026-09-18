import { EXAMEN_MEDICO_ITEMS } from "@src/lib/aspirantes/ficha-evaluacion";

export const CENSUS_EXPORT_COLUMN_GROUPS = [
  "Identidad",
  "Postulación",
  "Contacto",
  "Estudios",
  "Datos físicos",
  "Tallas",
  "Exámenes médicos",
] as const;

export type CensusExportColumnGroup = (typeof CENSUS_EXPORT_COLUMN_GROUPS)[number];

export type CensusExportColumn = {
  id: string;
  label: string;
  group: CensusExportColumnGroup;
  width: number;
  align: "left" | "center";
};

const BASE_EXPORT_COLUMNS: readonly CensusExportColumn[] = [
  { id: "numero", label: "N°", group: "Identidad", width: 6, align: "center" },
  { id: "nombreCompleto", label: "Nombre completo", group: "Identidad", width: 34, align: "left" },
  { id: "nombres", label: "Nombres", group: "Identidad", width: 22, align: "left" },
  { id: "apellidos", label: "Apellidos", group: "Identidad", width: 22, align: "left" },
  { id: "cedula", label: "Cédula", group: "Identidad", width: 14, align: "center" },
  { id: "sexo", label: "Sexo", group: "Identidad", width: 12, align: "center" },
  { id: "edad", label: "Edad", group: "Identidad", width: 8, align: "center" },
  { id: "nacimiento", label: "Nacimiento", group: "Identidad", width: 13, align: "center" },
  { id: "lugarNacimiento", label: "Lugar de nacimiento", group: "Identidad", width: 22, align: "left" },
  { id: "unidad", label: "Unidad postulante", group: "Postulación", width: 28, align: "left" },
  { id: "carrera", label: "Carrera", group: "Postulación", width: 34, align: "left" },
  { id: "calificacion", label: "Calificación", group: "Postulación", width: 14, align: "center" },
  { id: "peloton", label: "Pelotón", group: "Postulación", width: 16, align: "left" },
  { id: "telefono", label: "Teléfono", group: "Contacto", width: 14, align: "center" },
  { id: "correo", label: "Correo", group: "Contacto", width: 24, align: "left" },
  { id: "direccion", label: "Dirección", group: "Contacto", width: 28, align: "left" },
  { id: "estadoCivil", label: "Estado civil", group: "Contacto", width: 16, align: "left" },
  { id: "religion", label: "Religión", group: "Contacto", width: 16, align: "left" },
  { id: "deporte", label: "Deporte", group: "Contacto", width: 18, align: "left" },
  { id: "hijos", label: "Hijos", group: "Contacto", width: 8, align: "center" },
  { id: "contactoEmergencia", label: "Contacto de emergencia", group: "Contacto", width: 28, align: "left" },
  { id: "universidad", label: "Universidad", group: "Estudios", width: 24, align: "left" },
  { id: "paisUniversidad", label: "País de estudio", group: "Estudios", width: 16, align: "left" },
  { id: "tipoSangre", label: "Tipo de sangre", group: "Datos físicos", width: 12, align: "center" },
  { id: "estatura", label: "Estatura (cm)", group: "Datos físicos", width: 12, align: "center" },
  { id: "peso", label: "Peso (kg)", group: "Datos físicos", width: 12, align: "center" },
  { id: "tension", label: "Tensión arterial", group: "Datos físicos", width: 14, align: "center" },
  { id: "alergias", label: "Alergias", group: "Datos físicos", width: 22, align: "left" },
  { id: "condicionesMedicas", label: "Condiciones médicas", group: "Datos físicos", width: 24, align: "left" },
  { id: "discapacidad", label: "Discapacidad", group: "Datos físicos", width: 18, align: "left" },
  { id: "observaciones", label: "Observaciones médicas", group: "Datos físicos", width: 28, align: "left" },
  { id: "tallaGorra", label: "Gorra", group: "Tallas", width: 10, align: "center" },
  { id: "tallaCamisa", label: "Camisa", group: "Tallas", width: 10, align: "center" },
  { id: "tallaPantalon", label: "Pantalón", group: "Tallas", width: 10, align: "center" },
  { id: "tallaCalzado", label: "Calzado", group: "Tallas", width: 10, align: "center" },
];

const EXAM_EXPORT_COLUMNS: readonly CensusExportColumn[] = EXAMEN_MEDICO_ITEMS.map((item) => ({
  id: examExportColumnId(item.id),
  label: item.texto,
  group: "Exámenes médicos" as const,
  width: Math.min(22, Math.max(12, item.texto.length * 0.85)),
  align: "center" as const,
}));

export const CENSUS_EXPORT_COLUMNS: readonly CensusExportColumn[] = [...BASE_EXPORT_COLUMNS, ...EXAM_EXPORT_COLUMNS];

export const CENSUS_EXPORT_DEFAULT_IDS = ["numero", "nombreCompleto", "cedula"] as const;

/** Columnas de exportación que no se escriben al importar. */
export const CENSUS_IMPORT_SKIP_IDS = new Set(["numero", "edad"]);

const COLUMN_BY_ID = new Map(CENSUS_EXPORT_COLUMNS.map((c) => [c.id, c]));

export function examExportColumnId(examenId: string): string {
  return `exam_${examenId}`;
}

export function isExamExportColumnId(id: string): boolean {
  return id.startsWith("exam_");
}

export function examenIdFromExportColumn(id: string): string | null {
  if (!isExamExportColumnId(id)) return null;
  return id.slice("exam_".length);
}

export function getCensusExportColumn(id: string): CensusExportColumn | undefined {
  return COLUMN_BY_ID.get(id);
}

export function foldCensusHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const HEADER_TO_COLUMN_ID = new Map<string, string>();
for (const col of CENSUS_EXPORT_COLUMNS) {
  HEADER_TO_COLUMN_ID.set(foldCensusHeader(col.label), col.id);
  HEADER_TO_COLUMN_ID.set(foldCensusHeader(col.id), col.id);
}
HEADER_TO_COLUMN_ID.set("n", "numero");
HEADER_TO_COLUMN_ID.set("no", "numero");
HEADER_TO_COLUMN_ID.set("numero", "numero");
HEADER_TO_COLUMN_ID.set("ci", "cedula");
HEADER_TO_COLUMN_ID.set("ceduladeidentidad", "cedula");
HEADER_TO_COLUMN_ID.set("nombre", "nombreCompleto");
HEADER_TO_COLUMN_ID.set("nombresyapellidos", "nombreCompleto");
HEADER_TO_COLUMN_ID.set("estatura", "estatura");
HEADER_TO_COLUMN_ID.set("peso", "peso");
HEADER_TO_COLUMN_ID.set("tensionarterial", "tension");
HEADER_TO_COLUMN_ID.set("gorra", "tallaGorra");
HEADER_TO_COLUMN_ID.set("camisa", "tallaCamisa");
HEADER_TO_COLUMN_ID.set("pantalon", "tallaPantalon");
HEADER_TO_COLUMN_ID.set("calzado", "tallaCalzado");
HEADER_TO_COLUMN_ID.set("zapatos", "tallaCalzado");
HEADER_TO_COLUMN_ID.set("religion", "religion");
HEADER_TO_COLUMN_ID.set("credo", "religion");
HEADER_TO_COLUMN_ID.set("deporte", "deporte");
HEADER_TO_COLUMN_ID.set("deportequepractica", "deporte");
HEADER_TO_COLUMN_ID.set("deportequegusta", "deporte");

export function censusExportColumnIdFromHeader(header: string): string | undefined {
  const folded = foldCensusHeader(header);
  if (!folded) return undefined;
  return HEADER_TO_COLUMN_ID.get(folded);
}

export function normalizeCensusCedula(value: string): string {
  return value.replace(/\D+/g, "");
}

export function parseCensusExportColumnIds(raw: unknown): string[] | null {
  if (typeof raw === "string") {
    raw = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(raw)) return null;
  const ids = raw.filter((v): v is string => typeof v === "string").filter((id) => COLUMN_BY_ID.has(id));
  const unique = Array.from(new Set(ids));
  return unique.length ? unique : null;
}

export function moveCensusExportColumn(ids: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return ids;
  const next = [...ids];
  const [item] = next.splice(from, 1);
  if (!item) return ids;
  next.splice(to, 0, item);
  return next;
}
