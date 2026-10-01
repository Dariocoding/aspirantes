import type { Prisma } from "@src/generated/prisma";
import {
  condicionMilitarGroupLabel,
  condicionMilitarRank,
  parseCondicionCensusFilter,
} from "@src/lib/aspirantes/condicion-militar";
import { labelTipoEstudioNivel } from "@src/lib/aspirantes/tipo-estudio";
import { hasRealBirthDate } from "@src/lib/date";
import { MESES_TITULO } from "@src/lib/meses";

export function calificacionAdmisionEtiqueta(c: string) {
  if (c === "APTO") return "Apto";
  if (c === "NO_APTO") return "No apto";
  return "En evaluación";
}

export function sexoEtiqueta(sexo: string) {
  return sexo === "FEMENINO" ? "Femenino" : "Masculino";
}

export function buildAspiranteCensusWhere(
  sp: Record<string, string | undefined>,
  convocatoriaFiltroId?: string,
): Prisma.AspiranteWhereInput {
  const filters: Prisma.AspiranteWhereInput[] = [];
  if (convocatoriaFiltroId) {
    filters.push({ convocatoriaId: convocatoriaFiltroId });
  }
  const q = sp.q?.trim();
  if (q) {
    filters.push({
      OR: [
        { nombres: { contains: q, mode: "insensitive" } },
        { apellidos: { contains: q, mode: "insensitive" } },
        { cedula: { contains: q.replace(/\D/g, "") || q, mode: "insensitive" } },
      ],
    });
  }
  if (sp.sexo && sp.sexo !== "TODOS" && (sp.sexo === "MASCULINO" || sp.sexo === "FEMENINO")) {
    filters.push({ sexo: sp.sexo });
  }
  const peloton = sp.peloton?.trim();
  if (peloton && peloton !== "TODOS") {
    if (peloton === "SIN_ASIGNAR") {
      filters.push({ pelotonId: null });
    } else {
      filters.push({ pelotonId: peloton });
    }
  }
  const condicion = parseCondicionCensusFilter(sp.condicion);
  if (condicion === "SOLDADO_ACTIVO" || condicion === "SARGENTO_ACTIVO") {
    filters.push({ condicionMilitar: condicion });
  }

  return filters.length ? { AND: filters } : {};
}

export const CENSUS_SORT_KEYS = ["cedula", "nombres", "apellidos", "titulo", "nacimiento", "reciente"] as const;
export type CensusSortKey = (typeof CENSUS_SORT_KEYS)[number];

export const CENSUS_GROUP_KEYS = ["condicion", "carrera", "grado", "nacimiento-mes", "religion"] as const;
export type CensusGroupKey = (typeof CENSUS_GROUP_KEYS)[number];

export function isCensusSortKey(v: string | null | undefined): v is CensusSortKey {
  return Boolean(v && (CENSUS_SORT_KEYS as readonly string[]).includes(v));
}

export function isCensusGroupKey(v: string | null | undefined): v is CensusGroupKey {
  return Boolean(v && (CENSUS_GROUP_KEYS as readonly string[]).includes(v));
}

/**
 * Separa orden y agrupación. Las URLs viejas guardaban la agrupación en `sort`
 * (`sort=carrera`, etc.); en ese caso el orden dentro del grupo sigue siendo por nombre.
 */
export function resolveCensusPresentation(sp: { sort?: string; group?: string }): {
  sort: CensusSortKey;
  group: CensusGroupKey | null;
} {
  const groupFromParam = isCensusGroupKey(sp.group) ? sp.group : null;
  const legacyGroup = sp.group == null && isCensusGroupKey(sp.sort) ? sp.sort : null;
  const group = groupFromParam ?? legacyGroup;
  if (isCensusSortKey(sp.sort)) return { sort: sp.sort, group };
  return { sort: legacyGroup ? "nombres" : "cedula", group };
}

function sortFields(sort: CensusSortKey): Prisma.AspiranteOrderByWithRelationInput[] {
  if (sort === "nombres") return [{ nombres: "asc" }, { apellidos: "asc" }];
  if (sort === "apellidos") return [{ apellidos: "asc" }, { nombres: "asc" }];
  if (sort === "titulo") return [{ tituloUniversidad: "asc" }, { nombres: "asc" }, { apellidos: "asc" }];
  if (sort === "reciente") return [{ createdAt: "desc" }];
  if (sort === "nacimiento") return [{ fechaNacimiento: "asc" }, { cedula: "asc" }];
  return [{ cedula: "asc" }];
}

/** Orden de base de datos. Condición, grado y mes se ordenan en memoria. */
export function censusOrderBy(
  sort: CensusSortKey,
  group: CensusGroupKey | null,
): Prisma.AspiranteOrderByWithRelationInput | Prisma.AspiranteOrderByWithRelationInput[] {
  const primary: Prisma.AspiranteOrderByWithRelationInput[] =
    group === "carrera" ? [{ tituloUniversidad: "asc" }] : group === "religion" ? [{ religion: "asc" }] : [];
  const fields = [...primary, ...sortFields(sort)];
  return fields.length === 1 ? fields[0]! : fields;
}

export function censusSortInMemory(group: CensusGroupKey | null) {
  return group === "condicion" || group === "grado" || group === "nacimiento-mes";
}

export function isCensusCarreraGroupSort(sort: string | undefined) {
  return sort === "carrera";
}

export function isCensusReligionGroupSort(sort: string | undefined) {
  return sort === "religion";
}

/** Agrupa soldados activos, sargentos activos y quien aún no tiene condición. */
export function isCensusCondicionGroupSort(sort: string | undefined) {
  return sort === "condicion";
}

export { condicionMilitarGroupLabel };

/** Orden por mes del calendario (ene→dic), no por año. */
export function isCensusNacimientoMesSort(sort: string | undefined) {
  return sort === "nacimiento-mes";
}

/** Agrupa por nivel educativo: Postgrado → TSU → Pregrado. */
export function isCensusGradoGroupSort(sort: string | undefined) {
  return sort === "grado";
}

/**
 * Clave de grupo por grado (menor = más alto):
 * 0 Postgrado, 1 TSU, 2 Pregrado, 3 sin nivel.
 */
export function gradoEducativoGroupKey(tipoEstudio: string | null | undefined): number {
  const nivel = labelTipoEstudioNivel(tipoEstudio);
  if (nivel === "Postgrado") return 0;
  if (nivel === "TSU") return 1;
  if (nivel === "Pregrado") return 2;
  return 3;
}

export function gradoEducativoGroupLabel(key: number): string {
  if (key === 0) return "Postgrado";
  if (key === 1) return "TSU";
  if (key === 2) return "Pregrado";
  return "Sin grado educativo";
}

/**
 * Orden por grado educativo: Postgrado → TSU → Pregrado → sin nivel.
 * Dentro de cada grupo: nombre, apellido, cédula.
 */
export function sortAspirantesByGradoEducativo<
  T extends {
    tipoEstudio: string | null;
    nombres: string;
    apellidos: string;
    cedula: string;
  },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const rankDiff = gradoEducativoGroupKey(a.tipoEstudio) - gradoEducativoGroupKey(b.tipoEstudio);
    if (rankDiff !== 0) return rankDiff;
    const nameDiff = a.nombres.localeCompare(b.nombres, "es");
    if (nameDiff !== 0) return nameDiff;
    const apDiff = a.apellidos.localeCompare(b.apellidos, "es");
    if (apDiff !== 0) return apDiff;
    return a.cedula.localeCompare(b.cedula, "es", { numeric: true });
  });
}

/** Clave de grupo: 0–11 (mes) o -1 si la fecha aún no está cargada. */
export function nacimientoMesGroupKey(fecha: Date): number {
  return hasRealBirthDate(fecha) ? fecha.getMonth() : -1;
}

export function nacimientoMesGroupLabel(mesKey: number): string {
  if (mesKey < 0) return "Sin fecha de nacimiento";
  return MESES_TITULO[mesKey] ?? `Mes ${mesKey + 1}`;
}

/**
 * Orden de cumpleaños en el calendario: enero → diciembre, luego día.
 * Sin fecha real al final; empate por cédula.
 */
export function sortAspirantesByNacimientoMes<
  T extends { fechaNacimiento: Date; cedula: string },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aReal = hasRealBirthDate(a.fechaNacimiento);
    const bReal = hasRealBirthDate(b.fechaNacimiento);
    if (aReal !== bReal) return aReal ? -1 : 1;
    const monthDiff = a.fechaNacimiento.getMonth() - b.fechaNacimiento.getMonth();
    if (monthDiff !== 0) return monthDiff;
    const dayDiff = a.fechaNacimiento.getDate() - b.fechaNacimiento.getDate();
    if (dayDiff !== 0) return dayDiff;
    return a.cedula.localeCompare(b.cedula, "es", { numeric: true });
  });
}

type CensusOrderable = {
  cedula: string;
  nombres: string;
  apellidos: string;
  tituloUniversidad: string | null;
  fechaNacimiento: Date;
  createdAt: Date;
  religion: string | null;
  tipoEstudio: string | null;
  condicionMilitar: string | null;
};

function compareCensusText(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base", numeric: true });
}

function compareCensusSort(a: CensusOrderable, b: CensusOrderable, sort: CensusSortKey): number {
  if (sort === "nombres") {
    return (
      compareCensusText(a.nombres, b.nombres) ||
      compareCensusText(a.apellidos, b.apellidos) ||
      compareCensusText(a.cedula, b.cedula)
    );
  }
  if (sort === "apellidos") {
    return (
      compareCensusText(a.apellidos, b.apellidos) ||
      compareCensusText(a.nombres, b.nombres) ||
      compareCensusText(a.cedula, b.cedula)
    );
  }
  if (sort === "titulo") {
    return (
      compareCensusText(a.tituloUniversidad ?? "", b.tituloUniversidad ?? "") ||
      compareCensusText(a.nombres, b.nombres) ||
      compareCensusText(a.cedula, b.cedula)
    );
  }
  if (sort === "nacimiento") {
    const diff = a.fechaNacimiento.getTime() - b.fechaNacimiento.getTime();
    if (diff !== 0) return diff;
    return compareCensusText(a.cedula, b.cedula);
  }
  if (sort === "reciente") return b.createdAt.getTime() - a.createdAt.getTime();
  return compareCensusText(a.cedula, b.cedula);
}

function mesGroupRank(fecha: Date) {
  const key = nacimientoMesGroupKey(fecha);
  return key < 0 ? 99 : key;
}

function compareCensusGroup(a: CensusOrderable, b: CensusOrderable, group: CensusGroupKey | null): number {
  if (group === "condicion") {
    return condicionMilitarRank(a.condicionMilitar) - condicionMilitarRank(b.condicionMilitar);
  }
  if (group === "grado") {
    return gradoEducativoGroupKey(a.tipoEstudio) - gradoEducativoGroupKey(b.tipoEstudio);
  }
  if (group === "nacimiento-mes") return mesGroupRank(a.fechaNacimiento) - mesGroupRank(b.fechaNacimiento);
  if (group === "carrera") return compareCensusText(a.tituloUniversidad ?? "", b.tituloUniversidad ?? "");
  if (group === "religion") return compareCensusText(a.religion ?? "", b.religion ?? "");
  return 0;
}

/** Agrupa primero y, dentro de cada grupo, aplica el orden elegido. */
export function sortAspirantesForCensus<T extends CensusOrderable>(
  rows: T[],
  sort: CensusSortKey,
  group: CensusGroupKey | null,
): T[] {
  return [...rows].sort((a, b) => {
    const groupDiff = compareCensusGroup(a, b, group);
    if (groupDiff !== 0) return groupDiff;
    return compareCensusSort(a, b, sort);
  });
}

export function censusQueryString(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
) {
  const p = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "" && v !== "TODOS") p.set(k, v);
  }
  return p.toString();
}
