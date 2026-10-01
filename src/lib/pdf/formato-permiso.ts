import { format } from "date-fns";
import { labelCondicionMilitar } from "@src/lib/aspirantes/condicion-militar";
import { isMembreteLogoKind, PLANTILLA_MEMBRETE_CEFOA45, type MembreteLogoKind } from "@src/lib/membrete";
import { formatDuracionPermiso, labelTipoPermiso } from "@src/lib/permisos";

export const FORMATO_PERMISO_ID = "formato_permiso";
export const MAX_FORMATO_PERMISO_LINEAS = 8;

export const DEFAULT_FORMATO_PERMISO_NOTA =
  "NOTA: EN CASO DE EMERGENCIA POR FAVOR COMUNICARSE AL NÚMERO TELEFÓNICO INSTITUCIONAL. EL ASPIRANTE DEBERÁ TRAER LA COPIA DE LA CÉDULA DE SU REPRESENTANTE Y SUS ÚTILES PERSONALES COMPLETOS.";

export const DEFAULT_FORMATO_PERMISO_CARGO =
  "DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN DE OFICIALES ASIMILADO Y ASIMILADO TÉCNICO";

export type FormatoPermisoPlantilla = {
  lineas: string[];
  logoIzq: MembreteLogoKind;
  logoDer: MembreteLogoKind;
  titulo: string;
  compania: string;
  firmanteNombre: string;
  firmanteCargo: string;
  nota: string;
};

export type FormatoPermisoPresentacion = {
  lineas: string[];
  logoIzq: MembreteLogoKind;
  logoDer: MembreteLogoKind;
  titulo: string;
  jerarquia: string;
  apellidos: string;
  nombres: string;
  cedula: string;
  compania: string;
  duracion: string;
  desde: string;
  hasta: string;
  tipo: string;
  telefono: string;
  direccion: string;
  firmanteNombre: string;
  firmanteCargo: string;
  nota: string;
  anulado: boolean;
};

export type FormatoPermisoPersona = {
  condicionMilitar: string | null;
  apellidos: string;
  nombres: string;
  cedula: string;
  peloton: string | null;
  unidad: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo: string;
  fechaInicio: Date;
  fechaFin: Date;
  anulado: boolean;
  comandanteNombre: string | null;
};

export const DEFAULT_FORMATO_PERMISO: FormatoPermisoPlantilla = {
  lineas: [...PLANTILLA_MEMBRETE_CEFOA45],
  logoIzq: "ejercito",
  logoDer: "cefoa",
  titulo: "BOLETA DE PERMISO",
  compania: "",
  firmanteNombre: "",
  firmanteCargo: DEFAULT_FORMATO_PERMISO_CARGO,
  nota: DEFAULT_FORMATO_PERMISO_NOTA,
};

/** Persona de muestra para la vista previa del formato. */
export const FORMATO_PERMISO_EJEMPLO: FormatoPermisoPersona = {
  condicionMilitar: "SARGENTO_ACTIVO",
  apellidos: "Pérez García",
  nombres: "José Antonio",
  cedula: "12345678",
  peloton: "Pelotón 1",
  unidad: "Unidad postulante",
  telefono: "04120000000",
  direccion: "Sector ejemplo, estado Mérida",
  tipo: "FIN_DE_SEMANA",
  fechaInicio: new Date(2026, 3, 11, 8, 0),
  fechaFin: new Date(2026, 3, 14, 18, 0),
  anulado: false,
  comandanteNombre: null,
};

function up(value: string): string {
  return value.trim().toLocaleUpperCase("es");
}

export function parseFormatoPermisoLineas(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_FORMATO_PERMISO_LINEAS);
}

export function formatoPermisoLineasToText(lineas: readonly string[]): string {
  return lineas.join("\n");
}

export function permisoFormatoPdfUrl(permisoId: string): string {
  return `/api/permisos/${encodeURIComponent(permisoId)}/pdf`;
}

function logoKind(value: unknown, fallback: MembreteLogoKind): MembreteLogoKind {
  return typeof value === "string" && isMembreteLogoKind(value) ? value : fallback;
}

function text(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, max);
  return trimmed || fallback;
}

export function normalizeFormatoPermiso(
  raw:
    | {
        lineas?: readonly string[] | null;
        logoIzq?: string | null;
        logoDer?: string | null;
        titulo?: string | null;
        compania?: string | null;
        firmanteNombre?: string | null;
        firmanteCargo?: string | null;
        nota?: string | null;
      }
    | null
    | undefined,
): FormatoPermisoPlantilla {
  const base = DEFAULT_FORMATO_PERMISO;
  const lineas = Array.isArray(raw?.lineas)
    ? raw.lineas.map((line) => (typeof line === "string" ? line.trim() : "")).filter(Boolean).slice(0, MAX_FORMATO_PERMISO_LINEAS)
    : [];
  return {
    lineas: lineas.length ? lineas : [...base.lineas],
    logoIzq: logoKind(raw?.logoIzq, base.logoIzq),
    logoDer: logoKind(raw?.logoDer, base.logoDer),
    titulo: text(raw?.titulo, base.titulo, 80),
    compania: typeof raw?.compania === "string" ? raw.compania.trim().slice(0, 80) : "",
    firmanteNombre: typeof raw?.firmanteNombre === "string" ? raw.firmanteNombre.trim().slice(0, 120) : "",
    firmanteCargo: text(raw?.firmanteCargo, "", 220),
    nota: typeof raw?.nota === "string" ? raw.nota.trim().slice(0, 800) : base.nota,
  };
}

export function formatFechaPermisoBoleta(date: Date): string {
  return format(date, "d/M/yyyy");
}

export function jerarquiaPermiso(condicion: string | null | undefined): string {
  const label = labelCondicionMilitar(condicion);
  if (!label) return "";
  return up(label.replace(/\s+activo$/i, ""));
}

export function cedulaPermisoBoleta(cedula: string): string {
  const digits = cedula.replace(/\D/g, "");
  return digits || cedula.trim();
}

export function telefonoPermisoBoleta(telefono: string | null | undefined): string {
  const raw = (telefono ?? "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 7 && digits.length <= 13) return digits;
  return up(raw);
}

export function companiaPermiso(
  plantillaCompania: string,
  peloton: string | null | undefined,
  unidad: string | null | undefined,
): string {
  const fija = plantillaCompania.trim();
  if (fija) return up(fija);
  const pel = peloton?.trim();
  if (pel) return up(pel);
  const uni = unidad?.trim();
  if (uni) return up(uni);
  return "";
}

export function presentarFormatoPermiso(
  plantilla: FormatoPermisoPlantilla,
  persona: FormatoPermisoPersona,
): FormatoPermisoPresentacion {
  const normal = normalizeFormatoPermiso(plantilla);
  const firmante = normal.firmanteNombre.trim() || (persona.comandanteNombre ?? "").trim();
  return {
    lineas: normal.lineas.map((line) => up(line)),
    logoIzq: normal.logoIzq,
    logoDer: normal.logoDer,
    titulo: up(normal.titulo),
    jerarquia: jerarquiaPermiso(persona.condicionMilitar),
    apellidos: up(persona.apellidos),
    nombres: up(persona.nombres),
    cedula: cedulaPermisoBoleta(persona.cedula),
    compania: companiaPermiso(normal.compania, persona.peloton, persona.unidad),
    duracion: up(formatDuracionPermiso(persona.fechaInicio, persona.fechaFin)),
    desde: formatFechaPermisoBoleta(persona.fechaInicio),
    hasta: formatFechaPermisoBoleta(persona.fechaFin),
    tipo: up(labelTipoPermiso(persona.tipo)),
    telefono: telefonoPermisoBoleta(persona.telefono),
    direccion: up(persona.direccion ?? ""),
    firmanteNombre: up(firmante),
    firmanteCargo: up(normal.firmanteCargo),
    nota: up(normal.nota),
    anulado: persona.anulado,
  };
}
