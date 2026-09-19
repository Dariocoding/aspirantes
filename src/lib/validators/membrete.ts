import { z } from "zod";
import { isMembreteLogoKind, parseMembreteLineas } from "@src/lib/membrete";

const checkboxOn = z
  .union([z.literal("true"), z.literal("on"), z.literal(""), z.null(), z.undefined()])
  .optional()
  .transform((v) => v === "true" || v === "on");

const logoField = z
  .string()
  .trim()
  .refine((v) => isMembreteLogoKind(v), "Logo no válido");

const fields = z.object({
  nombre: z.string().trim().min(1, "Nombre obligatorio").max(120),
  lineasTexto: z.string().max(2000),
  logoIzq: logoField,
  logoDer: logoField,
  isDefault: checkboxOn,
});

function requireLineas(data: { lineasTexto: string }, ctx: z.RefinementCtx) {
  if (!parseMembreteLineas(data.lineasTexto).length) {
    ctx.addIssue({
      code: "custom",
      path: ["lineasTexto"],
      message: "Escriba al menos un renglón del membrete.",
    });
  }
}

export const membreteCreateSchema = fields.superRefine(requireLineas).transform((data) => ({
  ...data,
  lineas: parseMembreteLineas(data.lineasTexto),
}));

export const membreteUpdateSchema = fields
  .extend({
    id: z.string().trim().min(1, "Identificador obligatorio"),
  })
  .superRefine(requireLineas)
  .transform((data) => ({
    ...data,
    lineas: parseMembreteLineas(data.lineasTexto),
  }));
