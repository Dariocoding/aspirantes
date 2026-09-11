import type { Prisma } from "@src/generated/prisma";
import { fechaNacimientoFilterForAgeRange, hasRealBirthDate } from "@src/lib/date";
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
        { cedula: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (sp.sexo && sp.sexo !== "TODOS" && (sp.sexo === "MASCULINO" || sp.sexo === "FEMENINO")) {
    filters.push({ sexo: sp.sexo });
  }
  if (
    sp.calificacion &&
    sp.calificacion !== "TODOS" &&
    (sp.calificacion === "APTO" || sp.calificacion === "NO_APTO" || sp.calificacion === "EN_EVALUACION")
  ) {
    filters.push({ calificacionAdmision: sp.calificacion });
  }
  const unidad = sp.unidadPostulante?.trim();
  if (unidad && unidad !== "TODOS") {
    filters.push({ unidadPostulante: unidad });
  }
  const peloton = sp.peloton?.trim();
  if (peloton && peloton !== "TODOS") {
    if (peloton === "SIN_ASIGNAR") {
      filters.push({ pelotonId: null });
    } else {
      filters.push({ pelotonId: peloton });
    }
  }
  const emin = sp.edadMin ? Number(sp.edadMin) : NaN;
  const emax = sp.edadMax ? Number(sp.edadMax) : NaN;
  const fechaFilter = fechaNacimientoFilterForAgeRange({
    edadMin: Number.isFinite(emin) ? emin : undefined,
    edadMax: Number.isFinite(emax) ? emax : undefined,
  });
  if (fechaFilter) {
    filters.push({ fechaNacimiento: fechaFilter });
  }

  return filters.length ? { AND: filters } : {};
}

export function censusOrderBy(
  sort: string | undefined,
): Prisma.AspiranteOrderByWithRelationInput | Prisma.AspiranteOrderByWithRelationInput[] {
  if (sort === "nombres") return { nombres: "asc" };
  if (sort === "titulo") return { tituloUniversidad: "asc" };
  if (sort === "carrera") {
    // Agrupa por carrera (A-Z) y, dentro de cada una, orden alfabético por nombre.
    return [{ tituloUniversidad: "asc" }, { nombres: "asc" }, { apellidos: "asc" }];
  }
  if (sort === "reciente") return { createdAt: "desc" };
  if (sort === "nacimiento") return { fechaNacimiento: "asc" };
  // `nacimiento-mes` se ordena en memoria por mes/día (ver sortAspirantesByNacimientoMes).
  // Por defecto (y con sort=cedula): cédula ascendente.
  return { cedula: "asc" };
}

export function isCensusCarreraGroupSort(sort: string | undefined) {
  return sort === "carrera";
}

/** Orden por mes del calendario (ene→dic), no por año. */
export function isCensusNacimientoMesSort(sort: string | undefined) {
  return sort === "nacimiento-mes";
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
