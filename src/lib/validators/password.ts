import { z } from "zod";

/** Política institucional: longitud y mezcla mínima de caracteres. */
export const passwordPolicySchema = z
  .string()
  .min(10, "Mínimo 10 caracteres")
  .max(128, "Máximo 128 caracteres")
  .regex(/\p{L}/u, "Debe incluir al menos una letra")
  .regex(/\d/, "Debe incluir al menos un dígito");
