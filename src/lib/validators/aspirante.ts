import { z } from "zod";
import { ESTADO_CIVIL_VALUES } from "@src/lib/aspirantes/estado-civil";
import { TIPO_ESTUDIO_ALL_VALUES } from "@src/lib/aspirantes/tipo-estudio";
import {
  ageFromBirthDate,
  FECHA_NACIMIENTO_PENDIENTE,
  hasRealBirthDate,
  parseDateInputLocal,
} from "@src/lib/date";

const sexoEnum = z.enum(["MASCULINO", "FEMENINO"]);
const calificacionAdmisionEnum = z.enum(["APTO", "NO_APTO", "EN_EVALUACION"]);
const tipoEstudioEnum = z.enum(TIPO_ESTUDIO_ALL_VALUES);
const estadoCivilEnum = z.enum(ESTADO_CIVIL_VALUES);

const estadoCivilField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  estadoCivilEnum.nullable(),
);

function optionalFloat(max: number) {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().positive().max(max).optional());
}

function optionalYear() {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().int().min(1950, "Año inválido").max(2100, "Año inválido").optional());
}

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim()),
    z.string().max(max).nullable(),
  );

/** @deprecated Preferir `FECHA_NACIMIENTO_PENDIENTE` desde `@src/lib/date`. */
export const ASPIRANTE_FECHA_NACIMIENTO_PENDIENTE = FECHA_NACIMIENTO_PENDIENTE;

const estudioFields = {
  tipoEstudio: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    tipoEstudioEnum.nullable(),
  ),
  nombreUniversidad: optionalTrimmedString(200),
  tituloUniversidad: optionalTrimmedString(120),
  paisUniversidad: optionalTrimmedString(80),
  nucleoUniversidad: optionalTrimmedString(120),
  anioIngresoUniversidad: optionalYear(),
  anioEgresoUniversidad: optionalYear(),
};

type EstudioShape = {
  tipoEstudio: (typeof TIPO_ESTUDIO_ALL_VALUES)[number] | null;
  nombreUniversidad: string | null;
  tituloUniversidad: string | null;
  paisUniversidad: string | null;
  nucleoUniversidad: string | null;
  anioIngresoUniversidad?: number;
  anioEgresoUniversidad?: number;
};

function refineEstudioFields(data: EstudioShape, ctx: z.RefinementCtx) {
  const hasAny =
    data.tipoEstudio != null ||
    Boolean(data.nombreUniversidad) ||
    Boolean(data.tituloUniversidad) ||
    Boolean(data.paisUniversidad) ||
    Boolean(data.nucleoUniversidad) ||
    data.anioIngresoUniversidad != null ||
    data.anioEgresoUniversidad != null;

  if (!hasAny) return;

  if (!data.tipoEstudio) {
    ctx.addIssue({
      code: "custom",
      message: "Seleccione el grado educativo",
      path: ["tipoEstudio"],
    });
  }
  if (!data.nombreUniversidad) {
    ctx.addIssue({
      code: "custom",
      message: "Indique el nombre de la universidad o instituto",
      path: ["nombreUniversidad"],
    });
  }
  if (!data.tituloUniversidad) {
    ctx.addIssue({
      code: "custom",
      message: "Indique el título obtenido",
      path: ["tituloUniversidad"],
    });
  }
  const ingreso = data.anioIngresoUniversidad;
  const egreso = data.anioEgresoUniversidad;
  if (ingreso != null && egreso != null && egreso < ingreso) {
    ctx.addIssue({
      code: "custom",
      message: "El año de egreso no puede ser anterior al de ingreso",
      path: ["anioEgresoUniversidad"],
    });
  }
}

const optionalSexo = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  sexoEnum.optional(),
);

function coerceFechaNacimiento(v: unknown): Date | null | undefined {
  if (v === "" || v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  const s = String(v).trim();
  if (!s) return null;
  const local = parseDateInputLocal(s);
  if (local) return local;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

const optionalFechaNacimiento = z.preprocess(
  coerceFechaNacimiento,
  z.date().nullable(),
);

const requiredFechaNacimiento = z.preprocess((v) => {
  const d = coerceFechaNacimiento(v);
  return d === null ? undefined : d;
}, z.date({ message: "Fecha de nacimiento obligatoria" }));

function refineEdadDesdeNacimiento(
  fecha: Date | null | undefined,
  ctx: z.RefinementCtx,
  opts: { required?: boolean; min?: number; max?: number } = {},
) {
  const min = opts.min ?? 16;
  const max = opts.max ?? 80;
  if (fecha == null || !hasRealBirthDate(fecha)) {
    if (opts.required) {
      ctx.addIssue({
        code: "custom",
        message: "Fecha de nacimiento obligatoria",
        path: ["fechaNacimiento"],
      });
    }
    return;
  }
  const edad = ageFromBirthDate(fecha);
  if (edad == null || edad < min || edad > max) {
    ctx.addIssue({
      code: "custom",
      message: `La edad calculada debe estar entre ${min} y ${max} años (hoy tendría ${edad ?? "—"})`,
      path: ["fechaNacimiento"],
    });
  }
}

const optionalContactoString = (max: number) =>
  z.preprocess(
    (v) => (v === null || v === undefined ? "" : String(v).trim()),
    z.string().max(max),
  );

/**
 * Alta / edición desde personal: basta con nombres y cédula.
 * El resto se completa después (defaults seguros en BD).
 */
const aspiranteStaffBaseSchema = z.object({
  unidadPostulante: z.preprocess(
    (v) => (v === null || v === undefined ? "" : String(v).trim()),
    z.string().max(200, "Unidad postulante demasiado larga"),
  ),
  calificacionAdmision: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? "EN_EVALUACION" : v),
    calificacionAdmisionEnum,
  ),
  nombres: z.string().trim().min(1, "Nombres obligatorios").max(120),
  apellidos: z.preprocess(
    (v) => (v === null || v === undefined ? "" : String(v).trim()),
    z.string().max(120),
  ),
  cedula: z
    .string()
    .trim()
    .regex(/^[0-9]{6,12}$/, "Cédula: solo dígitos, entre 6 y 12 caracteres"),
  sexo: optionalSexo,
  fechaNacimiento: optionalFechaNacimiento,
  lugarNacimiento: z.preprocess(
    (v) => (v === null || v === undefined ? "" : String(v).trim()),
    z.string().max(200),
  ),
  direccion: z.string().trim().max(500).optional().nullable(),
  telefono: z.string().trim().max(40).optional().nullable(),
  correo: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : String(v).trim()),
    z.string().email("Correo inválido").optional(),
  ),
  hijosCantidad: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().int().min(0).max(30),
  ),
  estadoCivil: estadoCivilField,
  pelotonId: z.preprocess(
    (v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim()),
    z.string().min(1).nullable(),
  ),
  estaturaCm: optionalFloat(300),
  pesoKg: optionalFloat(400),
  tensionArterial: z.string().trim().max(20).optional().nullable(),
  tipoSangre: z.string().trim().max(10).optional().nullable(),
  alergias: z.string().trim().max(500).optional().nullable(),
  condicionesMedicas: z.string().trim().max(2000).optional().nullable(),
  discapacidad: z.string().trim().max(500).optional().nullable(),
  observaciones: z.string().trim().max(2000).optional().nullable(),
  contactoNombre: optionalContactoString(120),
  contactoParentesco: optionalContactoString(80),
  contactoTelefono: optionalContactoString(40),
  contactoDireccion: z.string().trim().max(500).optional().nullable(),
  ...estudioFields,
});

function refineStaffFechaNacimiento(
  data: { fechaNacimiento: Date | null } & EstudioShape,
  ctx: z.RefinementCtx,
) {
  refineEstudioFields(data, ctx);
  // Si cargaron fecha real, debe producir edad admisible; si queda vacía → placeholder.
  if (data.fechaNacimiento != null && hasRealBirthDate(data.fechaNacimiento)) {
    refineEdadDesdeNacimiento(data.fechaNacimiento, ctx);
  }
}

export const aspiranteCreateSchema = aspiranteStaffBaseSchema.superRefine(refineStaffFechaNacimiento);

export const aspiranteUpdateSchema = aspiranteStaffBaseSchema
  .extend({
    aspiranteId: z.string().trim().min(1, "Identificador de aspirante inválido"),
  })
  .superRefine(refineStaffFechaNacimiento);

/** Verificación pública: cédula en la convocatoria activa. */
export const aspiranteSelfServiceVerifySchema = z.object({
  cedula: z
    .string()
    .trim()
    .regex(/^[0-9]{6,12}$/, "Cédula: solo dígitos, entre 6 y 12 caracteres"),
});

/**
 * Actualización desde el portal público.
 * No incluye calificación, ficha de evaluación ni cédula/sexo (identidad de acceso).
 */
export const aspiranteSelfServiceUpdateSchema = z
  .object({
    aspiranteId: z.string().trim().min(1, "Identificador de aspirante inválido"),
    cedula: z
      .string()
      .trim()
      .regex(/^[0-9]{6,12}$/, "Cédula: solo dígitos, entre 6 y 12 caracteres"),
    unidadPostulante: z
      .string()
      .trim()
      .min(1, "Unidad postulante obligatoria")
      .max(200, "Unidad postulante demasiado larga"),
    nombres: z.string().trim().min(1, "Nombres obligatorios").max(120),
    apellidos: z.string().trim().min(1, "Apellidos obligatorios").max(120),
    fechaNacimiento: requiredFechaNacimiento,
    lugarNacimiento: z.string().trim().min(1, "Lugar de nacimiento obligatorio").max(200),
    direccion: z.string().trim().max(500).optional().nullable(),
    telefono: z.string().trim().max(40).optional().nullable(),
    correo: z.preprocess(
      (v) => (v === null || v === undefined || v === "" ? undefined : String(v).trim()),
      z.string().email("Correo inválido").optional(),
    ),
    hijosCantidad: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? 0 : v),
      z.coerce.number().int().min(0).max(30),
    ),
    estadoCivil: estadoCivilField,
    estaturaCm: optionalFloat(300),
    pesoKg: optionalFloat(400),
    tensionArterial: z.string().trim().max(20).optional().nullable(),
    tipoSangre: z.string().trim().max(10).optional().nullable(),
    alergias: z.string().trim().max(500).optional().nullable(),
    condicionesMedicas: z.string().trim().max(2000).optional().nullable(),
    discapacidad: z.string().trim().max(500).optional().nullable(),
    observaciones: z.string().trim().max(2000).optional().nullable(),
    contactoNombre: z.string().trim().min(1, "Contacto de emergencia obligatorio").max(120),
    contactoParentesco: z.string().trim().min(1, "Parentesco obligatorio").max(80),
    contactoTelefono: z.string().trim().min(1, "Teléfono de emergencia obligatorio").max(40),
    contactoDireccion: z.string().trim().max(500).optional().nullable(),
    ...estudioFields,
  })
  .superRefine((data, ctx) => {
    refineEstudioFields(data, ctx);
    refineEdadDesdeNacimiento(data.fechaNacimiento, ctx, { required: true });
  });
