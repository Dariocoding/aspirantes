import { z } from "zod";
import { isMembreteLogoKind } from "@src/lib/membrete";
import { parseFormatoPermisoLineas } from "@src/lib/pdf/formato-permiso";

const logoField = z
  .string()
  .trim()
  .refine((v) => isMembreteLogoKind(v), "Logo no válido");

export const formatoPermisoSchema = z
  .object({
    lineasTexto: z.string().max(2000),
    logoIzq: logoField,
    logoDer: logoField,
    titulo: z.string().trim().min(3, "Escriba el título.").max(80),
    compania: z.string().trim().max(80),
    firmanteNombre: z.string().trim().max(120),
    firmanteCargo: z.string().trim().max(220),
    nota: z.string().trim().max(800),
  })
  .superRefine((data, ctx) => {
    if (!parseFormatoPermisoLineas(data.lineasTexto).length) {
      ctx.addIssue({
        code: "custom",
        path: ["lineasTexto"],
        message: "Escriba al menos un renglón del encabezado.",
      });
    }
  })
  .transform((data) => ({
    ...data,
    lineas: parseFormatoPermisoLineas(data.lineasTexto),
  }));
