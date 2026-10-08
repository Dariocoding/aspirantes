import { foldBusqueda } from "@src/lib/text/fold";

export type AspiranteParaRol = {
  id: string;
  nombres: string;
  apellidos: string;
};

export type CoincidenciaRol =
  | { status: "vinculado"; aspiranteId: string; score: number }
  | { status: "ambiguo"; aspiranteIds: string[] }
  | { status: "sin_coincidencia" };

function tokens(value: string): string[] {
  return foldBusqueda(value)
    .replace(/0/g, "o")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function igualesEnElMismoLugar(a: string, b: string): number {
  let iguales = 0;
  const limite = Math.min(a.length, b.length);
  for (let i = 0; i < limite; i++) if (a[i] === b[i]) iguales += 1;
  return iguales;
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = Array.from({ length: b.length + 1 }, () => 0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j < prev.length; j++) prev[j] = curr[j]!;
  }
  return prev[b.length] ?? 0;
}

/** 1 es idéntico. Un prefijo corto o una letra de diferencia sigue contando. */
function puntajeToken(consulta: string, candidato: string): number {
  if (consulta === candidato) return 1;
  const corto = Math.min(consulta.length, candidato.length);
  const largo = Math.max(consulta.length, candidato.length);
  if (corto >= 4 && (candidato.startsWith(consulta) || consulta.startsWith(candidato)) && largo - corto <= 2) {
    return 0.9;
  }
  const distancia = levenshtein(consulta, candidato);
  if (corto >= 5 && distancia <= 1) return 0.85;
  if (corto >= 7 && distancia <= 2) return 0.75;
  if (
    consulta.length === candidato.length &&
    consulta.length >= 7 &&
    distancia <= 3 &&
    consulta.slice(0, 2) === candidato.slice(0, 2) &&
    igualesEnElMismoLugar(consulta, candidato) >= 4
  ) {
    return 0.82;
  }
  return 0;
}

type Puntaje = {
  id: string;
  cobertura: number;
  promedio: number;
};

function puntaje(nombreRol: string, aspirante: AspiranteParaRol): Puntaje | null {
  const consulta = tokens(nombreRol);
  if (consulta.length === 0) return null;
  const disponibles = tokens(`${aspirante.nombres} ${aspirante.apellidos}`);
  const usados = new Set<number>();
  let suma = 0;
  let aciertos = 0;
  for (const pieza of consulta) {
    let mejor = 0;
    let indice = -1;
    disponibles.forEach((candidato, i) => {
      if (usados.has(i)) return;
      const valor = puntajeToken(pieza, candidato);
      if (valor > mejor) {
        mejor = valor;
        indice = i;
      }
    });
    if (mejor >= 0.75 && indice >= 0) {
      usados.add(indice);
      suma += mejor;
      aciertos += 1;
    }
  }
  if (aciertos !== consulta.length) return null;
  return { id: aspirante.id, cobertura: 1, promedio: suma / aciertos };
}

/**
 * Vincula el nombre abreviado del rol con un aspirante.
 * Exige que cada palabra del rol aparezca en el nombre completo.
 * Si dos personas empatan, no vincula.
 */
export function coincidenciaRol(
  nombreRol: string,
  aspirantes: readonly AspiranteParaRol[],
): CoincidenciaRol {
  const consulta = tokens(nombreRol);
  if (consulta.length === 0) return { status: "sin_coincidencia" };

  const candidatos = aspirantes
    .map((aspirante) => puntaje(nombreRol, aspirante))
    .filter((item): item is Puntaje => item != null)
    .sort((a, b) => b.promedio - a.promedio);

  if (candidatos.length === 0) return { status: "sin_coincidencia" };

  const mejor = candidatos[0]!;
  const segundo = candidatos[1];

  if (consulta.length === 1) {
    const exactos = candidatos.filter((item) => item.promedio === 1);
    if (exactos.length === 1) return { status: "vinculado", aspiranteId: exactos[0]!.id, score: 1 };
    return exactos.length > 1
      ? { status: "ambiguo", aspiranteIds: exactos.map((item) => item.id) }
      : { status: "sin_coincidencia" };
  }

  if (mejor.promedio < 0.85) return { status: "sin_coincidencia" };

  if (segundo && segundo.promedio >= mejor.promedio - 0.05) {
    return {
      status: "ambiguo",
      aspiranteIds: candidatos.filter((item) => item.promedio >= mejor.promedio - 0.05).map((item) => item.id),
    };
  }

  return { status: "vinculado", aspiranteId: mejor.id, score: mejor.promedio };
}
