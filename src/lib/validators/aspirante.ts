import { z } from "zod";
import { ESTADO_CIVIL_VALUES } from "@src/lib/aspirantes/estado-civil";
import { TIPO_ESTUDIO_ALL_VALUES } from "@src/lib/aspirantes/tipo-estudio";

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

const aspiranteCreateBaseSchema = z.object({
  unidadPostulante: z
    .string()
    .trim()
    .min(1, "Unidad postulante obligatoria")
    .max(200, "Unidad postulante demasiado larga"),
  calificacionAdmision: calificacionAdmisionEnum,
  nombres: z.string().trim().min(1, "Nombres obligatorios").max(120),
  apellidos: z.string().trim().min(1, "Apellidos obligatorios").max(120),
  cedula: z
    .string()
    .trim()
    .regex(/^[0-9]{6,12}$/, "Cédula: solo dígitos, entre 6 y 12 caracteres"),
  edad: z.coerce.number().int().min(16, "Edad mínima 16").max(80, "Edad máxima 80"),
  sexo: sexoEnum,
  fechaNacimiento: z
    .string()
    .min(1, "Fecha de nacimiento obligatoria")
    .transform((s) => new Date(s))
    .refine((d) => !Number.isNaN(d.getTime()), "Fecha de nacimiento inválida"),
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
});

export const aspiranteCreateSchema = aspiranteCreateBaseSchema.superRefine(refineEstudioFields);

export const aspiranteUpdateSchema = aspiranteCreateBaseSchema
  .extend({
    aspiranteId: z.string().trim().min(1, "Identificador de aspirante inválido"),
  })
  .superRefine(refineEstudioFields);

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
    fechaNacimiento: z
      .string()
      .min(1, "Fecha de nacimiento obligatoria")
      .transform((s) => new Date(s))
      .refine((d) => !Number.isNaN(d.getTime()), "Fecha de nacimiento inválida"),
    lugarNacimiento: z.string().trim().min(1, "Lugar de nacimiento obligatorio").max(200),
    edad: z.coerce.number().int().min(16, "Edad mínima 16").max(80, "Edad máxima 80"),
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
  .superRefine(refineEstudioFields);
