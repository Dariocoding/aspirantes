import { z } from "zod";

const appIdSchema = z.enum(["personal", "sistema", "inventario"]);

const slugKey = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(64)
  .regex(/^[a-z][a-z0-9._-]*$/, "Use solo minúsculas, números, puntos o guiones (empiece con letra)");

export const moduleCreateSchema = z.object({
  key: slugKey,
  label: z.string().trim().min(1, "Nombre obligatorio").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  appId: appIdSchema.default("personal"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const moduleUpdateSchema = moduleCreateSchema.extend({
  id: z.string().min(1),
});

export const permissionCreateSchema = z.object({
  moduleId: z.string().min(1),
  key: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z][a-z0-9._-]*$/, "Clave inválida"),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const roleCreateSchema = z.object({
  key: slugKey,
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(100),
});

export const roleUpdateSchema = z.object({
  roleId: z.string().min(1),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export const rolePermissionsSchema = z.object({
  roleId: z.string().min(1),
  permissionIds: z.array(z.string().min(1)),
});
