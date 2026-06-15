import { z } from "zod";

const itemFields = {
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(120),
  unidad: z.string().trim().min(1, "Unidad obligatoria").max(32),
  stockMinimo: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(0, "Debe ser mayor o igual a cero").optional(),
  ),
  descripcion: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
} as const;

export const inventarioItemCreateSchema = z.object({
  area: z.enum(["RANCHO"]),
  ...itemFields,
  stockInicial: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : v),
    z.coerce.number().min(0, "Debe ser mayor o igual a cero"),
  ),
});

export const inventarioItemUpdateSchema = z.object({
  id: z.string().trim().min(1, "Identificador inválido"),
  ...itemFields,
  activo: z.preprocess(
    (v) => v === "on" || v === "true" || v === "1",
    z.boolean(),
  ),
});

export const inventarioMovimientoSchema = z.object({
  itemId: z.string().trim().min(1, "Ítem inválido"),
  tipo: z.enum(["ENTRADA", "SALIDA"]),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a cero"),
  motivo: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(200).optional(),
  ),
  notas: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});
