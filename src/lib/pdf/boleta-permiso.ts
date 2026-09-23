import sharp from "sharp";
import {
  COLOR_CABELLO_LABELS,
  COLOR_OJOS_LABELS,
  COLOR_PIEL_LABELS,
  formatTipoSangreHomologado,
  isColorCabello,
  isColorOjos,
  isColorPiel,
} from "@src/lib/aspirantes/senaletica";
import { pickFotoForBoleta } from "@src/lib/storage/aspirante-foto";
import { getObjectBuffer } from "@src/lib/storage/s3";

export const MAX_BOLETAS_PERMISO = 250;

export type BoletaPermisoPerson = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
};

export type BoletaPermisoCard = {
  id: string;
  serial: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  cabello: string;
  grupoSanguineo: string;
  ojos: string;
  colorPiel: string;
  direccion: string;
  telefono: string;
  emergenciaDireccion: string;
  emergenciaTelefono: string;
  foto: { data: Buffer; format: "jpg" | "png" } | null;
};

/** Textos fijos de la plantilla autorizada de boleta de permiso. */
export const BOLETA_DIRECTOR_CARGO =
  "DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN DE OFICIALES EN LA CATEGORÍA DE ASIMILADOS";
export const BOLETA_RECOMENDACION =
  "A quien se recomienda le sean guardadas las consideraciones debidas a su grado";
export const BOLETA_ARMAS =
  "Este Aspirante a Oficial no está autorizado para portar armas de fuego";
export const BOLETA_EMERGENCIA_INSTITUCIONAL =
  "EN CASO DE EMERGENCIA FAVOR INFORMAR A LOS TELÉFONOS. (0412) 396-8855, (0416) 642-7379, (0416) 232-3997";

export type BoletaPermisoConvocatoriaInfo = {
  nombre: string;
  codigo: string;
  anio: number;
  anioVence: number | null;
  vence: string;
  cursoNro: string;
  directorNombre: string;
  directorCargo: string;
  headerLines: string[];
};

export function formatBoletaSerial(rank1Based: number): string {
  return String(Math.max(1, Math.floor(rank1Based))).padStart(3, "0");
}

export function boletaRankByApellidos(people: BoletaPermisoPerson[]): Map<string, number> {
  const sorted = [...people].sort((a, b) => {
    const ap = a.apellidos.localeCompare(b.apellidos, "es", { sensitivity: "base" });
    if (ap !== 0) return ap;
    const no = a.nombres.localeCompare(b.nombres, "es", { sensitivity: "base" });
    if (no !== 0) return no;
    return a.cedula.localeCompare(b.cedula, "es", { numeric: true });
  });
  const map = new Map<string, number>();
  sorted.forEach((p, i) => map.set(p.id, i + 1));
  return map;
}

export function cursoNroFromConvocatoria(c: { codigo: string; nombre: string }): string {
  const fromCodigo = c.codigo.match(/(\d{1,4})/);
  if (fromCodigo?.[1]) return fromCodigo[1];
  const fromNombre =
    c.nombre.match(/(?:nro\.?|n[úu]mero|#)\s*(\d{1,4})/i) ?? c.nombre.match(/(\d{2,4})/);
  return fromNombre?.[1] ?? "";
}

/** «VENCE JULIO 2027». El año es el de vencimiento del curso, o el de la convocatoria si no está cargado. */
export function formatVenceBoleta(anioVence: number | null | undefined, anio: number): string {
  const year = anioVence != null && Number.isInteger(anioVence) ? anioVence : anio;
  return `VENCE JULIO ${year}`;
}

export function formatTelefonoBoleta(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.length === 10 && digits.startsWith("4")) {
    return `0${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return raw.trim();
}

/** Grupo sanguíneo como en la plantilla: ORH+, BRH+, ABRH-. */
export function formatGrupoSanguineoBoleta(
  grupo: string | null | undefined,
  factorRh: string | null | undefined,
): string {
  const compact = formatTipoSangreHomologado(grupo, factorRh);
  if (!compact) return "—";
  const m = compact.match(/^(AB|A|B|O)([+-])$/);
  if (!m) return compact.toUpperCase();
  return `${m[1]}RH${m[2]}`;
}

export function formatRasgoBoleta(value: string): string {
  const n = value.trim();
  if (!n || n === "—") return "—";
  const upper = n.toLocaleUpperCase("es");
  if (upper === "CLARA") return "BLANCA";
  return upper;
}

export function parseBoletaIdsParam(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/[,;\s]+/)
      : [];
  const ids = [...new Set(list.map((x) => String(x).trim()).filter(Boolean))];
  return ids.slice(0, MAX_BOLETAS_PERMISO);
}

export function boletaConvocatoriaInfo(c: {
  nombre: string;
  codigo: string;
  anio: number;
  anioVence?: number | null;
  comandanteNombre: string | null;
}): BoletaPermisoConvocatoriaInfo {
  const cursoNro = cursoNroFromConvocatoria(c);
  const anioVence = c.anioVence ?? null;
  return {
    nombre: c.nombre,
    codigo: c.codigo,
    anio: c.anio,
    anioVence,
    vence: formatVenceBoleta(anioVence, c.anio),
    cursoNro,
    directorNombre: (c.comandanteNombre ?? "").trim().toLocaleUpperCase("es"),
    directorCargo: BOLETA_DIRECTOR_CARGO,
    headerLines: [
      "República Bolivariana de Venezuela",
      "Ministerio del Poder Popular para la Defensa",
      "Ejército Bolivariano",
      "Dirección de Educación del Ejército",
      c.nombre.trim() ||
        (cursoNro
          ? `Curso Especial de Formación de Oficiales en las Categoría de Asimilados Nro. ${cursoNro}`
          : "Curso Especial de Formación de Oficiales en las Categoría de Asimilados"),
    ],
  };
}

function senaleticaLabel(
  value: string | null | undefined,
  labels: Record<string, string>,
  isKnown: (v: string | null | undefined) => boolean,
): string {
  if (!value) return "—";
  if (isKnown(value)) return labels[value] ?? value;
  return value;
}

export function boletaRasgosFromDatos(datos: {
  colorCabello?: string | null;
  tipoSangre?: string | null;
  factorRh?: string | null;
  colorOjos?: string | null;
  colorPiel?: string | null;
} | null): Pick<BoletaPermisoCard, "cabello" | "grupoSanguineo" | "ojos" | "colorPiel"> {
  return {
    cabello: formatRasgoBoleta(senaleticaLabel(datos?.colorCabello, COLOR_CABELLO_LABELS, isColorCabello)),
    grupoSanguineo: formatGrupoSanguineoBoleta(datos?.tipoSangre, datos?.factorRh),
    ojos: formatRasgoBoleta(senaleticaLabel(datos?.colorOjos, COLOR_OJOS_LABELS, isColorOjos)),
    colorPiel: formatRasgoBoleta(senaleticaLabel(datos?.colorPiel, COLOR_PIEL_LABELS, isColorPiel)),
  };
}

export { pickFotoForBoleta };

export async function loadFotoForBoletaPdf(
  fotoKey: string | null,
): Promise<{ data: Buffer; format: "jpg" } | null> {
  if (!fotoKey) return null;
  try {
    const { body } = await getObjectBuffer(fotoKey);
    const jpeg = await sharp(body)
      .rotate()
      .resize(360, 460, { fit: "cover", position: "centre" })
      .jpeg({ quality: 86 })
      .toBuffer();
    return { data: Buffer.from(jpeg), format: "jpg" };
  } catch {
    return null;
  }
}
