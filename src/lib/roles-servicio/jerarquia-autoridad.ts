import type { JerarquiaAutoridad } from "@src/generated/prisma";

export const JERARQUIA_AUTORIDAD_OPCIONES: { value: JerarquiaAutoridad; label: string }[] = [
  { value: "TENIENTE", label: "Teniente" },
  { value: "PRIMER_TENIENTE", label: "Primer Teniente" },
  { value: "CAPITAN", label: "Capitán" },
  { value: "MAYOR", label: "Mayor" },
  { value: "TENIENTE_CORONEL", label: "Teniente Coronel" },
  { value: "CORONEL", label: "Coronel" },
];

export function labelJerarquiaAutoridad(jerarquia: JerarquiaAutoridad | string): string {
  return JERARQUIA_AUTORIDAD_OPCIONES.find((item) => item.value === jerarquia)?.label ?? jerarquia;
}

/** Abreviaturas que suelen traer los roles de servicio en Excel. */
export function esGradoAutoridad(grado: string): boolean {
  return /^(PTTE|TNTE|TTE|CAP|MY|TC|CRNL|CORONEL|MAYOR|TENIENTE|CAPITAN|CAPITÁN)/i.test(grado.trim());
}

export function jerarquiaDesdeGrado(grado: string): JerarquiaAutoridad {
  const g = grado.trim().toUpperCase();
  if (/^CRNL|^CORONEL/.test(g)) return "CORONEL";
  if (/^TC|^T\.?\s*C/.test(g)) return "TENIENTE_CORONEL";
  if (/^MY|^MAYOR/.test(g)) return "MAYOR";
  if (/^CAP|^CAPIT/.test(g)) return "CAPITAN";
  if (/^PTTE|^1\s*TNTE|^PRIMER/.test(g)) return "PRIMER_TENIENTE";
  return "TENIENTE";
}
