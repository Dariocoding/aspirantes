import { z } from "zod";

export const esquelaPlantillaSaveSchema = z.object({
  layoutJson: z.string().trim().min(2, "Falta el diseño."),
  quitarFondo: z.string().optional(),
  quitarOverlay: z.string().optional(),
});
