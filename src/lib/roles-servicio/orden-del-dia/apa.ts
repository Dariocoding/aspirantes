import type { Transcripcion } from "@src/lib/roles-servicio/orden-del-dia/transcripciones";

/**
 * Cita parentética APA (7.ª ed.): (Bolívar, 1819)
 * A partir de una referencia como "Bolívar, S. (1819). Título."
 */
export function citaParenteticaApa(t: Transcripcion): string | null {
  if (!t.atribucion) return null;
  const m = t.atribucion.match(/^([^,(]+).*?\(([^)]+)\)/);
  if (!m) return null;
  return `(${m[1].trim()}, ${m[2].trim()})`;
}

/**
 * Texto de cita con comillas tipográficas APA.
 * Los artículos de ley se muestran sin comillas.
 */
export function textoCitaApa(t: Transcripcion): string {
  if (t.categoria === "ley_disciplina") return t.texto;
  const limpio = t.texto.replace(/^[«"“]|[»"”]\.?$/g, "").trim();
  return `“${limpio}”`;
}
