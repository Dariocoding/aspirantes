import { z } from "zod";
import { passwordPolicySchema } from "@/lib/validators/password";

const roleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "OPERADOR", "CONSULTA"]);

export const usuarioCreateSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  name: z.string().trim().min(1, "Nombre obligatorio").max(120),
  password: passwordPolicySchema,
  role: roleEnum,
});

export const usuarioRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleEnum,
});

export const usuarioActiveSchema = z.object({
  userId: z.string().min(1),
  active: z.boolean(),
});
