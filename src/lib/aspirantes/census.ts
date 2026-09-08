import type { Prisma } from "@src/generated/prisma";
import { fechaNacimientoFilterForAgeRange } from "@src/lib/date";

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
    // Agrupa por carrera y, dentro de cada una, ordena por cédula.
    return [{ tituloUniversidad: "asc" }, { cedula: "asc" }];
  }
  if (sort === "reciente") return { createdAt: "desc" };
  // Por defecto (y con sort=cedula): cédula ascendente.
  return { cedula: "asc" };
}

export function isCensusCarreraGroupSort(sort: string | undefined) {
  return sort === "carrera";
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
