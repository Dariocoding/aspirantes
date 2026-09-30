import { z } from "zod";
import { TipoPermisoPersonal } from "@src/generated/prisma";
import { parseDateTimeInputLocal } from "@src/lib/date";

const TIPO = [
  TipoPermisoPersonal.SALIDA,
  TipoPermisoPersonal.PERNOCTA,
  TipoPermisoPersonal.FIN_DE_SEMANA,
  TipoPermisoPersonal.MEDICO,
  TipoPermisoPersonal.COMISION,
  TipoPermisoPersonal.FAMILIAR,
  TipoPermisoPersonal.OTRO,
] as const;

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
}

const permisoDatosSchema = z.object({
  tipo: z.enum(TIPO, { message: "Tipo no válido" }),
  fechaInicio: z.string().trim().min(1, "Indique desde cuándo."),
  fechaFin: z.string().trim().min(1, "Indique hasta cuándo."),
  motivo: z.string().trim().min(3, "Escriba el motivo.").max(500),
  destino: optionalText(200),
  autorizadoPor: optionalText(120),
  observaciones: optionalText(1000),
});

const fields = permisoDatosSchema.extend({
  aspiranteId: z.string().trim().min(1, "Seleccione al personal."),
});

function withRange<T extends { fechaInicio: string; fechaFin: string }>(data: T, ctx: z.RefinementCtx) {
  const inicio = parseDateTimeInputLocal(data.fechaInicio);
  const fin = parseDateTimeInputLocal(data.fechaFin);
  if (!inicio) {
    ctx.addIssue({ code: "custom", path: ["fechaInicio"], message: "Fecha u hora de inicio no válida." });
  }
  if (!fin) {
    ctx.addIssue({ code: "custom", path: ["fechaFin"], message: "Fecha u hora de fin no válida." });
  }
  if (inicio && fin && fin.getTime() <= inicio.getTime()) {
    ctx.addIssue({
      code: "custom",
      path: ["fechaFin"],
      message: "La hora de fin debe ser posterior al inicio.",
    });
  }
  return { ...data, fechaInicioDate: inicio, fechaFinDate: fin };
}

export const permisoCreateSchema = fields.superRefine((data, ctx) => {
  withRange(data, ctx);
}).transform((data) => {
  const inicio = parseDateTimeInputLocal(data.fechaInicio)!;
  const fin = parseDateTimeInputLocal(data.fechaFin)!;
  return { ...data, fechaInicioDate: inicio, fechaFinDate: fin };
});

export const permisoUpdateSchema = fields
  .extend({
    id: z.string().trim().min(1, "Identificador obligatorio"),
  })
  .superRefine((data, ctx) => {
    withRange(data, ctx);
  })
  .transform((data) => {
    const inicio = parseDateTimeInputLocal(data.fechaInicio)!;
    const fin = parseDateTimeInputLocal(data.fechaFin)!;
    return { ...data, fechaInicioDate: inicio, fechaFinDate: fin };
  });

export const permisoSeleccionSchema = permisoDatosSchema
  .extend({
    aspiranteIds: z
      .array(z.string().trim().min(1))
      .min(1, "Seleccione al menos un aspirante.")
      .max(100, "Seleccione como máximo 100 aspirantes."),
  })
  .superRefine((data, ctx) => {
    withRange(data, ctx);
  })
  .transform((data) => {
    const inicio = parseDateTimeInputLocal(data.fechaInicio)!;
    const fin = parseDateTimeInputLocal(data.fechaFin)!;
    return { ...data, fechaInicioDate: inicio, fechaFinDate: fin };
  });

export const permisoAnularSchema = z.object({
  id: z.string().trim().min(1, "Identificador obligatorio"),
  anuladoMotivo: z.string().trim().min(3, "Indique por qué se anula.").max(400),
});
