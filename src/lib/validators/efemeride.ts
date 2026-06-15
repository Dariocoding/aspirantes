import { z } from "zod";
import { EFEMERIDE_TIPO_ENUM } from "@src/lib/efemeride-tipo";

export const efemerideCreateSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio").max(200),
  descripcion: z.string().trim().max(2000).optional().nullable(),
  dia: z.coerce.number().int().min(1).max(31),
  mes: z.coerce.number().int().min(1).max(12),
  tipo: z.enum(EFEMERIDE_TIPO_ENUM, { message: "Tipo no válido" }),
});

export const efemerideUpdateSchema = efemerideCreateSchema.extend({
  id: z.string().trim().min(1, "Identificador obligatorio"),
  activa: z
    .union([z.literal("true"), z.literal("on"), z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((v) => v === "true" || v === "on"),
});
