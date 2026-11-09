import { foldBusqueda } from "@src/lib/text/fold";

export function tokensBusqueda(texto: string): string[] {
  const vistos = new Set<string>();
  const tokens: string[] = [];
  for (const token of foldBusqueda(texto).split(/[^a-z0-9]+/)) {
    if (token.length < 2 || vistos.has(token)) continue;
    vistos.add(token);
    tokens.push(token);
  }
  return tokens;
}

export function fichaPersona(persona: { apellidos: string; nombres: string; cedula: string }): string {
  const cedula = persona.cedula.replace(/\D/g, "");
  return foldBusqueda(`${persona.apellidos} ${persona.nombres} ${cedula}`);
}

export function personaCoincide(
  persona: { apellidos: string; nombres: string; cedula: string },
  consulta: string,
): boolean {
  const tokens = tokensBusqueda(consulta);
  if (tokens.length === 0) return false;
  const ficha = fichaPersona(persona);
  return tokens.every((token) => ficha.includes(token));
}

export function rolCoincide(nombre: string, consulta: string): boolean {
  const tokens = tokensBusqueda(consulta);
  if (tokens.length === 0) return false;
  const ficha = foldBusqueda(nombre);
  return tokens.every((token) => ficha.includes(token));
}

export function sexoDeclaradoEnRol(nombre: string): "MASCULINO" | "FEMENINO" | null {
  const ficha = foldBusqueda(nombre);
  if (ficha.includes("femenin")) return "FEMENINO";
  if (ficha.includes("masculin")) return "MASCULINO";
  return null;
}

/** Pelotón escrito en el nombre del rol (1 o 2). Null si el rol no es de un pelotón. */
export function pelotonDeclaradoEnRol(nombre: string): 1 | 2 | null {
  const ficha = foldBusqueda(nombre);
  if (!ficha.includes("pelot")) return null;
  if (/(^|[^0-9])1\s*er\b|\bprimer\b/.test(ficha)) return 1;
  if (/(^|[^0-9])2\s*do\b|\bsegund/.test(ficha)) return 2;
  return null;
}
