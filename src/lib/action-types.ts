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
  fechaNacimiento: string;
  nombres: string;
  apellidos: string;
  lugarNacimiento: string;
  edad: number;
  sexo: "MASCULINO" | "FEMENINO";
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  hijosCantidad: number;
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
  fotoCedulaKey: string | null;
  fotoTituloKey: string | null;
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
