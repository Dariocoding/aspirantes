import { z } from "zod";
import { PELOTON_CANTIDAD_MAX, PELOTON_CANTIDAD_MIN } from "@src/lib/pelotones";

const convocatoriaFields = {
  codigo: z
    .string()
    .trim()
    .min(2, "Código demasiado corto")
    .max(32, "Código demasiado largo")
    .regex(/^[A-Za-z0-9._-]+$/, "Solo letras, números, punto, guión y guión bajo"),
  nombre: z.string().trim().min(3, "Nombre obligatorio").max(200),
  anio: z.coerce.number().int().min(2000).max(2100),
  comandanteNombre: z.preprocess(
    (v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim()),
    z.string().max(120).nullable(),
  ),
  comandanteTelefono: z.preprocess(
    (v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim()),
    z.string().max(40).nullable(),
  ),
  cantidadPelotones: z.coerce
    .number()
    .int("Indique un número entero de pelotones")
    .min(PELOTON_CANTIDAD_MIN, `Mínimo ${PELOTON_CANTIDAD_MIN} pelotones`)
    .max(PELOTON_CANTIDAD_MAX, `Máximo ${PELOTON_CANTIDAD_MAX} pelotones`),
} as const;

export const convocatoriaCreateSchema = z.object({
  ...convocatoriaFields,
  marcarActiva: z.preprocess(
    (v) => (v === "on" || v === "true" || v === "1" ? "on" : undefined),
    z.literal("on").optional(),
  ),
});

export const convocatoriaUpdateSchema = z.object({
  id: z.string().trim().min(1, "Identificador inválido"),
  ...convocatoriaFields,
});
