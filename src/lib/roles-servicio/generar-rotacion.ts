import type { MarcaDia } from "@src/lib/roles-servicio/marcas";

/** Identidad estable para detectar choques el mismo día entre roles. */
export type PersonaClave = {
  asignacionId: string;
  aspiranteId?: string | null;
  autoridadId?: string | null;
  nombre: string;
};

export type RolParaCalendario = {
  clave: string;
  /** Personas del rol en el orden de filas actual. */
  personas: PersonaClave[];
  /** Cupos por día para este rol (default 1). */
  cuposPorDia?: number;
  /** Marca de este rol. Si no viene, usa la del lote. */
  marca?: string;
  /** Marca distinta por cupo dentro de este rol (T1, T2, T3). */
  marcasPorCupo?: string[];
};

export type GenerarCalendarioMultiRolInput = {
  roles: RolParaCalendario[];
  desdeDia: number;
  hastaDia: number;
  /**
   * Si viene, solo estos días reciben marca.
   * Sirve para saltar feriados o armar una parte del mes.
   */
  dias?: number[];
  /** Cupos por día si el rol no define los suyos. */
  cuposPorDia?: number;
  marca?: string;
  /** Marca distinta por cupo (0 = T1, 1 = T2…). Si falta, usa `marca`. */
  marcasPorCupo?: string[];
  /** Semilla para barajar (mismo seed → mismo resultado). */
  seed: number;
};

export type MarcasPorAsignacion = {
  asignacionId: string;
  dias: MarcaDia[];
};

export type GenerarCalendarioMultiRolResult = {
  porAsignacion: MarcasPorAsignacion[];
  totalMarcas: number;
  /** Cupos que no se pudieron llenar por choque de mismo día. */
  cuposVacios: number;
};

/** PRNG determinista (mulberry32). */
export function crearRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function barajar<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Clave de persona para choques entre roles. */
export function clavePersona(p: PersonaClave): string {
  if (p.aspiranteId) return `a:${p.aspiranteId}`;
  if (p.autoridadId) return `u:${p.autoridadId}`;
  const nombre = p.nombre.trim().toUpperCase().replace(/\s+/g, " ");
  return nombre ? `n:${nombre}` : `id:${p.asignacionId}`;
}

export function sugerirCuposPorNombreRol(nombre: string): number {
  if (/rond[ií]n|inspecci/i.test(nombre)) return 2;
  return 1;
}

/**
 * Calendario multi-rol: baraja cada rol, rellena día a día maximizando el hueco
 * desde la última marca de cada persona, sin que nadie tenga dos marcas el mismo día.
 */
function diasObjetivo(input: GenerarCalendarioMultiRolInput): number[] {
  if (input.dias && input.dias.length > 0) {
    return [...new Set(input.dias.map((dia) => Math.floor(dia)))]
      .filter((dia) => dia >= 1 && dia <= 31)
      .sort((a, b) => a - b);
  }
  const desde = Math.max(1, Math.min(31, Math.floor(input.desdeDia)));
  const hasta = Math.max(desde, Math.min(31, Math.floor(input.hastaDia)));
  const dias: number[] = [];
  for (let dia = desde; dia <= hasta; dia += 1) dias.push(dia);
  return dias;
}

export function generarCalendarioMultiRol(
  input: GenerarCalendarioMultiRolInput,
): GenerarCalendarioMultiRolResult {
  const dias = diasObjetivo(input);
  const marca = (input.marca ?? "X").trim().toUpperCase() || "X";
  const marcasPorCupo = (input.marcasPorCupo ?? []).map(
    (item) => item.trim().toUpperCase() || marca,
  );
  const cuposDefault = Math.max(1, Math.floor(input.cuposPorDia ?? 1));
  const rng = crearRng(input.seed >>> 0);

  type Slot = {
    persona: PersonaClave;
    clave: string;
    /** Índice en el orden barajado (desempate). */
    ordenBaraja: number;
  };

  type RolEstado = {
    clave: string;
    cupos: number;
    marca: string;
    marcasPorCupo: string[];
    slots: Slot[];
    cursor: number;
    /** Último día de servicio por clave de persona (en este rol). */
    ultimoDiaPorClave: Map<string, number>;
  };

  const roles: RolEstado[] = [];
  for (const rol of input.roles) {
    const personas = rol.personas.filter((p) => p.asignacionId);
    if (personas.length === 0) continue;
    const barajadas = barajar(personas, rng);
    const marcaRol = (rol.marca ?? marca).trim().toUpperCase() || marca;
    roles.push({
      clave: rol.clave,
      cupos: Math.max(1, Math.min(barajadas.length, Math.floor(rol.cuposPorDia ?? cuposDefault))),
      marca: marcaRol,
      marcasPorCupo: (rol.marcasPorCupo ?? marcasPorCupo).map(
        (item) => item.trim().toUpperCase() || marcaRol,
      ),
      slots: barajadas.map((persona, ordenBaraja) => ({
        persona,
        clave: clavePersona(persona),
        ordenBaraja,
      })),
      cursor: 0,
      ultimoDiaPorClave: new Map(),
    });
  }

  const marcasPorId = new Map<string, MarcaDia[]>();
  for (const rol of roles) {
    for (const slot of rol.slots) {
      if (!marcasPorId.has(slot.persona.asignacionId)) {
        marcasPorId.set(slot.persona.asignacionId, []);
      }
    }
  }

  /** Personas ya ocupadas en un día (cualquier rol del lote). */
  const ocupadasPorDia = new Map<number, Set<string>>();
  let totalMarcas = 0;
  let cuposVacios = 0;

  for (const dia of dias) {
    const ocupadasHoy = ocupadasPorDia.get(dia) ?? new Set<string>();
    ocupadasPorDia.set(dia, ocupadasHoy);

    for (const rol of roles) {
      const usadasEnRolHoy = new Set<string>();
      for (let cupo = 0; cupo < rol.cupos; cupo += 1) {
        let mejor: Slot | null = null;
        let mejorHueco = -1;

        for (let intento = 0; intento < rol.slots.length; intento += 1) {
          const idx = (rol.cursor + intento) % rol.slots.length;
          const slot = rol.slots[idx]!;
          if (usadasEnRolHoy.has(slot.clave)) continue;
          if (ocupadasHoy.has(slot.clave)) continue;

          const ultimo = rol.ultimoDiaPorClave.get(slot.clave);
          const hueco = ultimo == null ? Number.POSITIVE_INFINITY : dia - ultimo;
          if (
            !mejor ||
            hueco > mejorHueco ||
            (hueco === mejorHueco && slot.ordenBaraja < mejor.ordenBaraja)
          ) {
            mejor = slot;
            mejorHueco = hueco;
          }
        }

        if (!mejor) {
          cuposVacios += 1;
          continue;
        }

        const lista = marcasPorId.get(mejor.persona.asignacionId)!;
        lista.push({ dia, marca: rol.marcasPorCupo[cupo] ?? rol.marca });
        ocupadasHoy.add(mejor.clave);
        usadasEnRolHoy.add(mejor.clave);
        rol.ultimoDiaPorClave.set(mejor.clave, dia);
        totalMarcas += 1;
        // Avanza el cursor después de la elegida (diagonal que “sube”).
        const pos = rol.slots.findIndex((s) => s.clave === mejor!.clave);
        rol.cursor = pos >= 0 ? (pos + 1) % rol.slots.length : rol.cursor;
      }
    }
  }

  const porAsignacion: MarcasPorAsignacion[] = [...marcasPorId.entries()].map(
    ([asignacionId, dias]) => ({
      asignacionId,
      dias: dias.sort((a, b) => a.dia - b.dia),
    }),
  );

  return { porAsignacion, totalMarcas, cuposVacios };
}

/** @deprecated Usar generarCalendarioMultiRol. Conservado para compatibilidad. */
export type GenerarRotacionInput = {
  personas: number;
  desdeDia: number;
  hastaDia: number;
  separacion: number;
  cuposPorDia?: number;
  marca?: string;
  inicioPersona?: number;
};

export type GenerarRotacionResult = {
  porPersona: MarcaDia[][];
  totalMarcas: number;
};

/** Wrapper legacy: un solo rol anónimo con N personas. */
export function generarRotacion(input: GenerarRotacionInput): GenerarRotacionResult {
  const n = Math.max(0, Math.floor(input.personas));
  const personas: PersonaClave[] = Array.from({ length: n }, (_, i) => ({
    asignacionId: `p-${i}`,
    nombre: `P${i}`,
  }));
  const seed = (input.inicioPersona ?? 0) * 997 + n * 31 + input.separacion;
  const result = generarCalendarioMultiRol({
    roles: [{ clave: "unico", personas, cuposPorDia: input.cuposPorDia }],
    desdeDia: input.desdeDia,
    hastaDia: input.hastaDia,
    marca: input.marca,
    seed,
  });
  const porPersona: MarcaDia[][] = Array.from({ length: n }, (_, i) => {
    const found = result.porAsignacion.find((x) => x.asignacionId === `p-${i}`);
    return found?.dias ?? [];
  });
  return { porPersona, totalMarcas: result.totalMarcas };
}

/** Fusiona marcas nuevas con las existentes. Fuera de los días elegidos se conservan. */
export function fusionarMarcas(params: {
  existentes: MarcaDia[];
  nuevas: MarcaDia[];
  desdeDia: number;
  hastaDia: number;
  /** Si viene, solo estos días se reemplazan (aunque caigan dentro del rango). */
  dias?: number[];
  /** Si true, borra marcas del rango antes de escribir las nuevas. */
  reemplazarRango: boolean;
}): MarcaDia[] {
  const { desdeDia, hastaDia, reemplazarRango } = params;
  const conjunto = params.dias ? new Set(params.dias) : null;
  const enAlcance = (dia: number) =>
    conjunto ? conjunto.has(dia) : dia >= desdeDia && dia <= hastaDia;
  const fuera = params.existentes.filter((m) => !enAlcance(m.dia));
  const enRangoPrevias = reemplazarRango
    ? []
    : params.existentes.filter((m) => enAlcance(m.dia));
  const porDia = new Map<number, string>();
  for (const m of fuera) porDia.set(m.dia, m.marca);
  for (const m of enRangoPrevias) porDia.set(m.dia, m.marca);
  for (const m of params.nuevas) porDia.set(m.dia, m.marca);
  return [...porDia.entries()]
    .map(([dia, marca]) => ({ dia, marca }))
    .sort((a, b) => a.dia - b.dia);
}

export function contarDsFs(
  dias: MarcaDia[],
  anio: number,
  mes: number,
  esAmarilla: (anio: number, mes: number, dia: number) => boolean,
): { ds: number; fs: number; total: number } {
  let ds = 0;
  let fs = 0;
  for (const m of dias) {
    if (esAmarilla(anio, mes, m.dia)) fs += 1;
    else ds += 1;
  }
  return { ds, fs, total: dias.length };
}
