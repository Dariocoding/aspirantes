import type { JerarquiaAutoridad } from "@src/generated/prisma";
import { esGradoAutoridad } from "@src/lib/roles-servicio/jerarquia-autoridad";
import { coincidenciaRol, type AspiranteParaRol } from "@src/lib/roles-servicio/match";

export type AutoridadParaRol = {
  id: string;
  nombres: string;
  apellidos: string;
};

export type VinculoRol = {
  aspiranteId: string | null;
  autoridadId: string | null;
};

export function vincularPersonaRol(
  nombre: string,
  grado: string,
  aspirantes: readonly AspiranteParaRol[],
  autoridades: readonly AutoridadParaRol[],
): VinculoRol {
  if (!nombre.trim()) return { aspiranteId: null, autoridadId: null };

  const matchAutoridad = coincidenciaRol(nombre, autoridades);
  const matchAspirante = coincidenciaRol(nombre, aspirantes);
  const priorizarAutoridad = esGradoAutoridad(grado);

  if (priorizarAutoridad && matchAutoridad.status === "vinculado") {
    return { aspiranteId: null, autoridadId: matchAutoridad.aspiranteId };
  }
  if (matchAspirante.status === "vinculado") {
    return { aspiranteId: matchAspirante.aspiranteId, autoridadId: null };
  }
  if (matchAutoridad.status === "vinculado") {
    return { aspiranteId: null, autoridadId: matchAutoridad.aspiranteId };
  }
  return { aspiranteId: null, autoridadId: null };
}

export type AutoridadSeed = {
  nombres: string;
  apellidos: string;
  jerarquia: JerarquiaAutoridad;
  cedula?: string;
};
