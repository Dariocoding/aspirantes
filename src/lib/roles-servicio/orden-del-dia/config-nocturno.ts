/**
 * Configuración de la sección NOCTURNO de la Orden del día.
 * Editable desde Roles de servicio → Orden nocturna.
 */

export const ORDEN_NOCTURNO_CONFIG_ID = "orden_nocturno";

export type TurnoNocturnoEtiqueta = "1ER" | "2DO" | "3ER" | "4TO" | "5TO" | "6TO";

export type BinomioNocturnoConfig = {
  id: string;
  /** Turno que aparece en la columna TURNO. */
  turno: TurnoNocturnoEtiqueta;
  /**
   * Etiqueta en columna SERVICIO (p. ej. IMAGINARIA).
   * Si está vacío, se usa el nombre del rol fuente.
   */
  servicioEtiqueta: string;
  /** Claves de RolServicio que alimentan este binomio. */
  rolClaves: string[];
};

export type OrdenNocturnoConfig = {
  /**
   * Rol(es) cuyo personal de servicio ese día aparece como RONDA
   * (por defecto: oficial de día).
   */
  rondaRolClaves: string[];
  /** Texto fijo en columna SERVICIO para la ronda. */
  rondaServicioEtiqueta: string;
  /** Turno mostrado junto a RONDA (vacío = sin turno). */
  rondaTurno: TurnoNocturnoEtiqueta | "";
  /**
   * Binomios: cada turno de imaginaria toma el personal de los roles indicados.
   * 1ER ← guardia de aula, 2DO ← cuartelero, 3ER ← guardia de baño (por defecto).
   */
  binomios: BinomioNocturnoConfig[];
};

/** Patrones para auto-sugerir claves al hidratar la UI (no se persisten). */
export const PATRONES_SUGERENCIA = {
  ronda: [/oficial\s+de\s+d[ií]a/i],
  aula: [/aula|guardia\s+de\s+aula/i],
  cuartel: [/cuarteler/i],
  bano: [/ba[nñ]o/i],
} as const;

export const TURNOS_NOCTURNOS: readonly TurnoNocturnoEtiqueta[] = [
  "1ER",
  "2DO",
  "3ER",
  "4TO",
  "5TO",
  "6TO",
];

export function defaultOrdenNocturnoConfig(): OrdenNocturnoConfig {
  return {
    rondaRolClaves: [],
    rondaServicioEtiqueta: "RONDA",
    rondaTurno: "1ER",
    binomios: [
      {
        id: "binomio-1er",
        turno: "1ER",
        servicioEtiqueta: "IMAGINARIA",
        rolClaves: [],
      },
      {
        id: "binomio-2do",
        turno: "2DO",
        servicioEtiqueta: "IMAGINARIA",
        rolClaves: [],
      },
      {
        id: "binomio-3er",
        turno: "3ER",
        servicioEtiqueta: "IMAGINARIA",
        rolClaves: [],
      },
    ],
  };
}

export function normalizeOrdenNocturnoConfig(raw: unknown): OrdenNocturnoConfig {
  const base = defaultOrdenNocturnoConfig();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  const rondaRolClaves = Array.isArray(o.rondaRolClaves)
    ? o.rondaRolClaves.filter((x): x is string => typeof x === "string")
    : base.rondaRolClaves;

  const rondaServicioEtiqueta =
    typeof o.rondaServicioEtiqueta === "string" && o.rondaServicioEtiqueta.trim()
      ? o.rondaServicioEtiqueta.trim()
      : base.rondaServicioEtiqueta;

  const rondaTurno =
    o.rondaTurno === "" || TURNOS_NOCTURNOS.includes(o.rondaTurno as TurnoNocturnoEtiqueta)
      ? (o.rondaTurno as TurnoNocturnoEtiqueta | "")
      : base.rondaTurno;

  let binomios = base.binomios;
  if (Array.isArray(o.binomios) && o.binomios.length > 0) {
    binomios = o.binomios
      .map((item, index): BinomioNocturnoConfig | null => {
        if (!item || typeof item !== "object") return null;
        const b = item as Record<string, unknown>;
        const turno = TURNOS_NOCTURNOS.includes(b.turno as TurnoNocturnoEtiqueta)
          ? (b.turno as TurnoNocturnoEtiqueta)
          : TURNOS_NOCTURNOS[Math.min(index, TURNOS_NOCTURNOS.length - 1)]!;
        return {
          id: typeof b.id === "string" && b.id ? b.id : `binomio-${index + 1}`,
          turno,
          servicioEtiqueta:
            typeof b.servicioEtiqueta === "string" ? b.servicioEtiqueta.trim() : "IMAGINARIA",
          rolClaves: Array.isArray(b.rolClaves)
            ? b.rolClaves.filter((x): x is string => typeof x === "string")
            : [],
        };
      })
      .filter((x): x is BinomioNocturnoConfig => x != null);
  }

  return { rondaRolClaves, rondaServicioEtiqueta, rondaTurno, binomios };
}

/** Si no hay claves guardadas, sugiere por nombre de rol. */
export function sugerirClavesPorPatron(
  planes: { clave: string; nombre: string }[],
  patrones: readonly RegExp[],
): string[] {
  return planes
    .filter((p) => patrones.some((re) => re.test(p.nombre)))
    .map((p) => p.clave);
}

export function hidratarSugerenciasClaves(
  config: OrdenNocturnoConfig,
  planes: { clave: string; nombre: string }[],
): OrdenNocturnoConfig {
  const next = structuredClone(config);
  if (next.rondaRolClaves.length === 0) {
    next.rondaRolClaves = sugerirClavesPorPatron(planes, PATRONES_SUGERENCIA.ronda);
  }
  const patronesBinomio = [
    PATRONES_SUGERENCIA.aula,
    PATRONES_SUGERENCIA.cuartel,
    PATRONES_SUGERENCIA.bano,
  ] as const;
  next.binomios = next.binomios.map((b, i) => {
    if (b.rolClaves.length > 0) return b;
    const patrones = patronesBinomio[i] ?? PATRONES_SUGERENCIA.aula;
    return { ...b, rolClaves: sugerirClavesPorPatron(planes, patrones) };
  });
  return next;
}
