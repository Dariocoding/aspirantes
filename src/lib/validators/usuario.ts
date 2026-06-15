import { passwordPolicySchema } from "@src/lib/validators/password";
import { z } from "zod";

export const usuarioCreateSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  name: z.string().trim().min(1, "Nombre obligatorio").max(120),
  password: passwordPolicySchema,
  roleId: z.string().min(1, "Seleccione un rol"),
});

export const usuarioRoleSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

export const usuarioActiveSchema = z.object({
  userId: z.string().min(1),
  active: z.boolean(),
});
