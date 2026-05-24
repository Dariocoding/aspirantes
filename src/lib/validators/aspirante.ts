import { z } from "zod";

const sexoEnum = z.enum(["MASCULINO", "FEMENINO"]);
const calificacionAdmisionEnum = z.enum(["APTO", "NO_APTO", "EN_EVALUACION"]);

function optionalFloat(max: number) {
  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().positive().max(max).optional());
}

export const aspiranteCreateSchema = z.object({
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
});

export const aspiranteUpdateSchema = aspiranteCreateSchema.extend({
  aspiranteId: z.string().trim().min(1, "Identificador de aspirante inválido"),
});
