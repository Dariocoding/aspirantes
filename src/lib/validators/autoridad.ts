import { z } from "zod";

const JERARQUIAS = [
  "TENIENTE",
  "PRIMER_TENIENTE",
  "CAPITAN",
  "MAYOR",
  "TENIENTE_CORONEL",
  "CORONEL",
] as const;

const opcional = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((v) => (v?.trim() ? v.trim() : null));

export const autoridadCreateSchema = z.object({
  nombres: z.string().trim().min(1, "Nombres obligatorios").max(120),
  apellidos: z.string().trim().min(1, "Apellidos obligatorios").max(120),
  cedula: opcional,
  telefono: opcional,
  correo: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .refine((v) => !v || z.string().email().safeParse(v).success, "Correo no válido"),
  jerarquia: z.enum(JERARQUIAS, { message: "Jerarquía no válida" }),
});

export const autoridadUpdateSchema = autoridadCreateSchema.extend({
  id: z.string().trim().min(1, "Identificador obligatorio"),
  activa: z
    .union([z.literal("true"), z.literal("on"), z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((v) => v === "true" || v === "on"),
});
