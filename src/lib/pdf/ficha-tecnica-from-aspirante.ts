import { labelEstadoCivilPdf } from "@src/lib/aspirantes/estado-civil";
import { parseFichaEvaluacion } from "@src/lib/aspirantes/ficha-evaluacion";
import { labelTipoEstudioPdf } from "@src/lib/aspirantes/tipo-estudio";
import { ageFromBirthDate } from "@src/lib/date";
import type { AspiranteFichaTecnicaPdfProps } from "@src/lib/pdf/aspirante-ficha-tecnica-document";
import { pickFotoForFichaTecnica } from "@src/lib/storage/aspirante-foto";
import { getObjectBuffer } from "@src/lib/storage/s3";

export type AspiranteForFichaTecnicaPdf = {
  nombres: string;
  apellidos: string;
  cedula: string;
  fechaNacimiento: Date;
  sexo: string;
  telefono: string | null;
  hijosCantidad: number;
  estadoCivil: string | null;
  tituloUniversidad: string | null;
  unidadPostulante: string;
  tipoEstudio: string | null;
  nombreUniversidad: string | null;
  paisUniversidad: string | null;
  anioIngresoUniversidad: number | null;
  anioEgresoUniversidad: number | null;
  nucleoUniversidad: string | null;
  fichaEvaluacion: unknown;
  convocatoria: {
    nombre: string;
    codigo: string;
    comandanteNombre: string | null;
    comandanteTelefono: string | null;
  };
};

/** La foto propia de la ficha tiene prioridad. Si no existe o no se puede embeber, usa la de carnet. */
export async function resolveFotoFichaTecnicaPdf(
  fotoFichaTecnicaKey: string | null | undefined,
  fotoCarnetKey: string | null | undefined,
): Promise<Buffer | null> {
  const propia = fotoFichaTecnicaKey?.trim();
  if (propia) {
    const buffer = await loadFotoForFichaTecnicaPdf(propia);
    if (buffer) return buffer;
  }
  return loadFotoForFichaTecnicaPdf(pickFotoForFichaTecnica(null, fotoCarnetKey));
}

export async function loadFotoForFichaTecnicaPdf(fotoKey: string | null): Promise<Buffer | null> {
  if (!fotoKey) return null;
  const lower = fotoKey.toLowerCase();
  // @react-pdf solo embebe JPEG/PNG de forma fiable
  if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
    return null;
  }
  try {
    const { body } = await getObjectBuffer(fotoKey);
    return body;
  } catch {
    return null;
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]!, index);
    }
  });
  await Promise.all(workers);
  return results;
}

export function fichaTecnicaPdfPropsFromAspirante(
  a: AspiranteForFichaTecnicaPdf,
  foto: Buffer | null,
): AspiranteFichaTecnicaPdfProps {
  return {
    nombres: a.nombres,
    apellidos: a.apellidos,
    cedula: a.cedula,
    edad: ageFromBirthDate(a.fechaNacimiento) ?? 0,
    sexo: a.sexo === "FEMENINO" ? "FEMENINO" : "MASCULINO",
    telefono: a.telefono,
    hijosCantidad: a.hijosCantidad,
    estadoCivil: labelEstadoCivilPdf(a.estadoCivil ?? "SOLTERO"),
    especialidad: a.tituloUniversidad,
    unidadPostulante: a.unidadPostulante,
    convocatoriaNombre: a.convocatoria.nombre,
    convocatoriaCodigo: a.convocatoria.codigo,
    foto,
    ficha: parseFichaEvaluacion(a.fichaEvaluacion),
    nivelEducativo: labelTipoEstudioPdf(a.tipoEstudio),
    cmdteCursoNombre: a.convocatoria.comandanteNombre,
    cmdteCursoTelefono: a.convocatoria.comandanteTelefono,
    estudios:
      a.nombreUniversidad || a.tituloUniversidad
        ? [
            {
              universidad: a.nombreUniversidad ?? "",
              titulo: a.tituloUniversidad ?? "",
              pais: a.paisUniversidad ?? "",
              anioIngreso: a.anioIngresoUniversidad != null ? String(a.anioIngresoUniversidad) : "",
              anioEgreso: a.anioEgresoUniversidad != null ? String(a.anioEgresoUniversidad) : "",
              nucleo: a.nucleoUniversidad ?? "",
            },
          ]
        : undefined,
    investigacionAdministrativa: false,
    investigacionJudicial: false,
    registroSiipol: false,
    investigacionPenalMilitar: false,
    juicioAbierto: false,
    estudioCulminado: true,
  };
}
