import type { Prisma } from "@/generated/prisma";

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
  const edad: { gte?: number; lte?: number } = {};
  const emin = sp.edadMin ? Number(sp.edadMin) : NaN;
  const emax = sp.edadMax ? Number(sp.edadMax) : NaN;
  if (Number.isFinite(emin)) edad.gte = emin;
  if (Number.isFinite(emax)) edad.lte = emax;
  if (Object.keys(edad).length) filters.push({ edad });

  return filters.length ? { AND: filters } : {};
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
