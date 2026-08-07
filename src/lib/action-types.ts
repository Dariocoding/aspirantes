import type { TipoEstudioValue } from "@src/lib/aspirantes/tipo-estudio";

export type AspiranteActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const aspiranteInitialActionState: AspiranteActionState = { ok: false, errors: {} };

/** Estado del portal público de actualización por cédula. */
export type AspiranteSelfServiceState = {
  ok: boolean;
  errors: Record<string, string>;
  /** Tras verificación exitosa: datos editables del aspirante. */
  record?: AspiranteSelfServiceRecord | null;
};

export type AspiranteSelfServiceRecord = {
  aspiranteId: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  lugarNacimiento: string;
  edad: number;
  sexo: "MASCULINO" | "FEMENINO";
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  hijosCantidad: number;
  estadoCivil: "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO" | "UNION_ESTABLE" | null;
  estaturaCm: number | null;
  pesoKg: number | null;
  tipoSangre: string | null;
  alergias: string | null;
  condicionesMedicas: string | null;
  discapacidad: string | null;
  observaciones: string | null;
  contactoNombre: string;
  contactoParentesco: string;
  contactoTelefono: string;
  contactoDireccion: string | null;
  unidadPostulante: string;
  convocatoriaNombre: string;
  convocatoriaCodigo: string;
  fotoKey: string | null;
  /** URL firmada temporal para previsualizar la foto tipo carnet en el portal público. */
  fotoPerfilUrl: string | null;
  fotoCedulaKey: string | null;
  fotoTituloKey: string | null;
  tipoEstudio: TipoEstudioValue | null;
  nombreUniversidad: string | null;
  tituloUniversidad: string | null;
  paisUniversidad: string | null;
  nucleoUniversidad: string | null;
  anioIngresoUniversidad: number | null;
  anioEgresoUniversidad: number | null;
};

export const aspiranteSelfServiceInitialState: AspiranteSelfServiceState = {
  ok: false,
  errors: {},
  record: null,
};

export type EfemerideActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const efemerideInitialActionState: EfemerideActionState = { ok: false, errors: {} };

export type UsuarioActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const usuarioInitialActionState: UsuarioActionState = { ok: false, errors: {} };

export type InventarioActionState = {
  ok: boolean;
  errors: Record<string, string>;
};

export const inventarioInitialActionState: InventarioActionState = { ok: false, errors: {} };
