import type { Sexo } from "@src/generated/prisma";

const CODIGO_RE = /^([A-Za-z])(\d{1,3})$/;

export type CodigoBinomioParts = {
  letra: string;
  numero: number;
  /** Forma canónica, p. ej. A01 */
  codigo: string;
};

/** Normaliza `a1` / `A1` / `A01` → `A01`. Vacío → null. */
export function normalizarCodigoBinomio(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!trimmed) return null;
  const m = CODIGO_RE.exec(trimmed);
  if (!m) return null;
  const letra = m[1]!;
  const numero = Number.parseInt(m[2]!, 10);
  if (!Number.isFinite(numero) || numero < 1 || numero > 999) return null;
  return `${letra}${String(numero).padStart(2, "0")}`;
}

export function parseCodigoBinomio(raw: string | null | undefined): CodigoBinomioParts | null {
  const codigo = normalizarCodigoBinomio(raw);
  if (!codigo) return null;
  const m = CODIGO_RE.exec(codigo);
  if (!m) return null;
  return {
    letra: m[1]!,
    numero: Number.parseInt(m[2]!, 10),
    codigo,
  };
}

/** Clave de pareja: el código impar del par (A01/A02 → A01). */
export function claveParejaBinomio(raw: string | null | undefined): string | null {
  const parts = parseCodigoBinomio(raw);
  if (!parts) return null;
  const impar = parts.numero % 2 === 0 ? parts.numero - 1 : parts.numero;
  return `${parts.letra}${String(impar).padStart(2, "0")}`;
}

/** Compañero esperado: A01→A02, A02→A01. Null si el código no es válido. */
export function codigoCompaneroBinomio(raw: string | null | undefined): string | null {
  const parts = parseCodigoBinomio(raw);
  if (!parts) return null;
  const otro = parts.numero % 2 === 0 ? parts.numero - 1 : parts.numero + 1;
  if (otro < 1) return null;
  return `${parts.letra}${String(otro).padStart(2, "0")}`;
}

export function esCodigoBinomioImpar(raw: string | null | undefined): boolean {
  const parts = parseCodigoBinomio(raw);
  return parts != null && parts.numero % 2 === 1;
}

export type PersonaBinomioCelda = {
  codigo: string;
  nombre: string;
  cedula: string;
};

export type FilaBinomioAgrupada = {
  clave: string;
  letra: string;
  numeroClave: number;
  pelotonLabel: string;
  pelotonNumero: number;
  sexo: string;
  p1: PersonaBinomioCelda | null;
  p2: PersonaBinomioCelda | null;
};

export type AspiranteParaBinomio = {
  nombres: string;
  apellidos: string;
  cedula: string;
  sexo: string;
  codigoBinomio: string | null;
  pelotonLabel: string | null;
  pelotonNumero: number | null;
};

function nombreCompletoBinomio(r: AspiranteParaBinomio): string {
  return `${r.nombres} ${r.apellidos}`.trim().toUpperCase();
}

function etiquetaSexoBinomio(sexo: string): string {
  return sexo === "FEMENINO" ? "Femenino" : "Masculino";
}

/** Agrupa aspirantes en filas de pareja (impar | par) para export Excel. */
export function agruparFilasBinomio(rows: AspiranteParaBinomio[]): {
  parejas: FilaBinomioAgrupada[];
  sinCodigo: AspiranteParaBinomio[];
} {
  const byClave = new Map<string, FilaBinomioAgrupada>();
  const sinCodigo: AspiranteParaBinomio[] = [];

  for (const r of rows) {
    const parts = parseCodigoBinomio(r.codigoBinomio);
    const clave = claveParejaBinomio(r.codigoBinomio);
    if (!parts || !clave) {
      sinCodigo.push(r);
      continue;
    }

    let fila = byClave.get(clave);
    if (!fila) {
      fila = {
        clave,
        letra: parts.letra,
        numeroClave: parseCodigoBinomio(clave)!.numero,
        pelotonLabel: r.pelotonLabel?.trim() || "—",
        pelotonNumero: r.pelotonNumero ?? 999,
        sexo: etiquetaSexoBinomio(r.sexo),
        p1: null,
        p2: null,
      };
      byClave.set(clave, fila);
    } else if (r.pelotonNumero != null && r.pelotonNumero < fila.pelotonNumero) {
      fila.pelotonNumero = r.pelotonNumero;
      fila.pelotonLabel = r.pelotonLabel?.trim() || fila.pelotonLabel;
    }

    const codigo = parts.codigo;
    const persona: PersonaBinomioCelda = {
      codigo,
      nombre: nombreCompletoBinomio(r),
      cedula: r.cedula,
    };
    if (esCodigoBinomioImpar(codigo)) {
      fila.p1 = persona;
    } else {
      fila.p2 = persona;
    }
  }

  const parejas = [...byClave.values()].sort((a, b) => {
    if (a.pelotonNumero !== b.pelotonNumero) return a.pelotonNumero - b.pelotonNumero;
    if (a.letra !== b.letra) return a.letra.localeCompare(b.letra);
    return a.numeroClave - b.numeroClave;
  });

  sinCodigo.sort((a, b) => nombreCompletoBinomio(a).localeCompare(nombreCompletoBinomio(b), "es"));

  return { parejas, sinCodigo };
}

export type CompaneroBinomioCheck = {
  sexo: Sexo;
  pelotonId: string | null;
};

/**
 * Si ya hay alguien con el código compañero, exige mismo sexo y mismo pelotón.
 * Devuelve mensaje de error o null si ok / no hay compañero.
 */
export function validarCompatibilidadCompanero(
  aspirante: CompaneroBinomioCheck,
  companero: CompaneroBinomioCheck | null,
): string | null {
  if (!companero) return null;
  if (companero.sexo !== aspirante.sexo) {
    return "El compañero de binomio debe ser del mismo sexo (hombre–hombre o mujer–mujer).";
  }
  if ((companero.pelotonId ?? null) !== (aspirante.pelotonId ?? null)) {
    return "El compañero de binomio debe pertenecer al mismo pelotón.";
  }
  return null;
}

type PrismaBinomioClient = {
  aspirante: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: { id: true; sexo: true; pelotonId: true; codigoBinomio: true; nombres: true; apellidos: true };
    }) => Promise<{
      id: string;
      sexo: Sexo;
      pelotonId: string | null;
      codigoBinomio: string | null;
      nombres: string;
      apellidos: string;
    } | null>;
  };
};

/**
 * Valida unicidad del código en la convocatoria y compatibilidad con el compañero (si existe).
 */
export async function resolveCodigoBinomioForAspirante(
  db: PrismaBinomioClient,
  opts: {
    convocatoriaId: string;
    aspiranteId?: string | null;
    codigoBinomio: string | null;
    sexo: Sexo;
    pelotonId: string | null;
  },
): Promise<{ ok: true; codigoBinomio: string | null } | { ok: false; error: string }> {
  const codigo = opts.codigoBinomio;
  if (!codigo) return { ok: true, codigoBinomio: null };

  const taken = await db.aspirante.findFirst({
    where: {
      convocatoriaId: opts.convocatoriaId,
      codigoBinomio: codigo,
      deletedAt: null,
      ...(opts.aspiranteId ? { NOT: { id: opts.aspiranteId } } : {}),
    },
    select: {
      id: true,
      sexo: true,
      pelotonId: true,
      codigoBinomio: true,
      nombres: true,
      apellidos: true,
    },
  });
  if (taken) {
    return {
      ok: false,
      error: `El código ${codigo} ya está asignado a ${taken.nombres} ${taken.apellidos}.`,
    };
  }

  const companeroCodigo = codigoCompaneroBinomio(codigo);
  if (companeroCodigo) {
    const companero = await db.aspirante.findFirst({
      where: {
        convocatoriaId: opts.convocatoriaId,
        codigoBinomio: companeroCodigo,
        deletedAt: null,
        ...(opts.aspiranteId ? { NOT: { id: opts.aspiranteId } } : {}),
      },
      select: {
        id: true,
        sexo: true,
        pelotonId: true,
        codigoBinomio: true,
        nombres: true,
        apellidos: true,
      },
    });
    const incompat = validarCompatibilidadCompanero(
      { sexo: opts.sexo, pelotonId: opts.pelotonId },
      companero,
    );
    if (incompat) return { ok: false, error: incompat };
  }

  return { ok: true, codigoBinomio: codigo };
}
