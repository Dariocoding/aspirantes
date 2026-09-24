export const CENSUS_COLUMN_GROUPS = ["Identidad", "Postulación", "Contacto", "Estudios", "Datos físicos", "Tallas"] as const;

export type CensusColumnGroup = (typeof CENSUS_COLUMN_GROUPS)[number];

export type CensusOptionalColumnId =
  | "fotoPermiso"
  | "documentos"
  | "unidad"
  | "carrera"
  | "sexo"
  | "edad"
  | "nacimiento"
  | "lugarNacimiento"
  | "calificacion"
  | "peloton"
  | "telefono"
  | "correo"
  | "direccion"
  | "estadoCivil"
  | "religion"
  | "deporte"
  | "hijos"
  | "contactoEmergencia"
  | "universidad"
  | "paisUniversidad"
  | "tipoSangre"
  | "estatura"
  | "peso"
  | "tension"
  | "tallaGorra"
  | "tallaCamisa"
  | "tallaPantalon"
  | "tallaCalzado";

export type CensusOptionalColumn = {
  id: CensusOptionalColumnId;
  label: string;
  group: CensusColumnGroup;
  defaultVisible: boolean;
  /** Ancho sugerido del encabezado (clases Tailwind). */
  headClassName: string;
  minWidthRem: number;
};

/** Columnas opcionales. Nombre, cédula y acciones no figuran aquí: siempre visibles. */
export const CENSUS_OPTIONAL_COLUMNS: readonly CensusOptionalColumn[] = [
  {
    id: "fotoPermiso",
    label: "Foto de permiso",
    group: "Identidad",
    defaultVisible: true,
    headClassName: "w-[6.5rem]",
    minWidthRem: 6.5,
  },
  {
    id: "documentos",
    label: "Documentos",
    group: "Identidad",
    defaultVisible: true,
    headClassName: "w-[16rem]",
    minWidthRem: 16,
  },
  { id: "sexo", label: "Sexo", group: "Identidad", defaultVisible: true, headClassName: "w-12", minWidthRem: 3 },
  { id: "edad", label: "Edad", group: "Identidad", defaultVisible: true, headClassName: "w-12", minWidthRem: 3 },
  {
    id: "nacimiento",
    label: "Nacimiento",
    group: "Identidad",
    defaultVisible: true,
    headClassName: "w-[7.5rem]",
    minWidthRem: 7.5,
  },
  {
    id: "lugarNacimiento",
    label: "Lugar de nacimiento",
    group: "Identidad",
    defaultVisible: false,
    headClassName: "w-[12rem]",
    minWidthRem: 12,
  },
  { id: "unidad", label: "Unidad", group: "Postulación", defaultVisible: true, headClassName: "w-[14rem]", minWidthRem: 14 },
  { id: "carrera", label: "Carrera", group: "Postulación", defaultVisible: true, headClassName: "w-[14rem]", minWidthRem: 14 },
  {
    id: "calificacion",
    label: "Calificación",
    group: "Postulación",
    defaultVisible: false,
    headClassName: "w-[8rem]",
    minWidthRem: 8,
  },
  { id: "peloton", label: "Pelotón", group: "Postulación", defaultVisible: false, headClassName: "w-[9rem]", minWidthRem: 9 },
  { id: "telefono", label: "Teléfono", group: "Contacto", defaultVisible: false, headClassName: "w-[9rem]", minWidthRem: 9 },
  { id: "correo", label: "Correo", group: "Contacto", defaultVisible: false, headClassName: "w-[12rem]", minWidthRem: 12 },
  {
    id: "direccion",
    label: "Dirección",
    group: "Contacto",
    defaultVisible: false,
    headClassName: "w-[14rem]",
    minWidthRem: 14,
  },
  {
    id: "estadoCivil",
    label: "Estado civil",
    group: "Contacto",
    defaultVisible: false,
    headClassName: "w-[8rem]",
    minWidthRem: 8,
  },
  {
    id: "religion",
    label: "Religión",
    group: "Contacto",
    defaultVisible: false,
    headClassName: "w-[9rem]",
    minWidthRem: 9,
  },
  {
    id: "deporte",
    label: "Deporte",
    group: "Contacto",
    defaultVisible: false,
    headClassName: "w-[10rem]",
    minWidthRem: 10,
  },
  { id: "hijos", label: "Hijos", group: "Contacto", defaultVisible: false, headClassName: "w-14", minWidthRem: 3.5 },
  {
    id: "contactoEmergencia",
    label: "Contacto de emergencia",
    group: "Contacto",
    defaultVisible: false,
    headClassName: "w-[12rem]",
    minWidthRem: 12,
  },
  {
    id: "universidad",
    label: "Universidad",
    group: "Estudios",
    defaultVisible: false,
    headClassName: "w-[12rem]",
    minWidthRem: 12,
  },
  {
    id: "paisUniversidad",
    label: "País de estudio",
    group: "Estudios",
    defaultVisible: false,
    headClassName: "w-[9rem]",
    minWidthRem: 9,
  },
  {
    id: "tipoSangre",
    label: "Tipo de sangre",
    group: "Datos físicos",
    defaultVisible: false,
    headClassName: "w-[7rem]",
    minWidthRem: 7,
  },
  { id: "estatura", label: "Estatura (m)", group: "Datos físicos", defaultVisible: false, headClassName: "w-[6rem]", minWidthRem: 6 },
  { id: "peso", label: "Peso", group: "Datos físicos", defaultVisible: false, headClassName: "w-[6rem]", minWidthRem: 6 },
  {
    id: "tension",
    label: "Tensión arterial",
    group: "Datos físicos",
    defaultVisible: false,
    headClassName: "w-[7rem]",
    minWidthRem: 7,
  },
  { id: "tallaGorra", label: "Gorra", group: "Tallas", defaultVisible: false, headClassName: "w-16", minWidthRem: 4 },
  { id: "tallaCamisa", label: "Camisa", group: "Tallas", defaultVisible: false, headClassName: "w-16", minWidthRem: 4 },
  {
    id: "tallaPantalon",
    label: "Pantalón",
    group: "Tallas",
    defaultVisible: false,
    headClassName: "w-16",
    minWidthRem: 4,
  },
  { id: "tallaCalzado", label: "Calzado", group: "Tallas", defaultVisible: false, headClassName: "w-16", minWidthRem: 4 },
];

export const CENSUS_OPTIONAL_COLUMN_IDS = CENSUS_OPTIONAL_COLUMNS.map((c) => c.id);

export const CENSUS_DEFAULT_VISIBLE_IDS: CensusOptionalColumnId[] = CENSUS_OPTIONAL_COLUMNS.filter(
  (c) => c.defaultVisible,
).map((c) => c.id);

const OPTIONAL_ID_SET = new Set<string>(CENSUS_OPTIONAL_COLUMN_IDS);

export const CENSUS_COLUMNS_STORAGE_KEY = "personal.aspirantes.census.columns.v4";

export function isCensusOptionalColumnId(value: string): value is CensusOptionalColumnId {
  return OPTIONAL_ID_SET.has(value);
}

export function parseCensusVisibleColumnIds(raw: unknown): CensusOptionalColumnId[] | null {
  if (!Array.isArray(raw)) return null;
  const ids = raw.filter((v): v is string => typeof v === "string").filter(isCensusOptionalColumnId);
  const unique = Array.from(new Set(ids));
  return unique.length ? unique : [];
}

export function sameCensusColumnIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}
