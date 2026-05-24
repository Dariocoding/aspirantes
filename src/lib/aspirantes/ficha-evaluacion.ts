import { z } from "zod";

/** Versión actual del documento JSON guardado en `Aspirante.fichaEvaluacion`. */
export const FICHA_EVALUACION_VERSION = 1 as const;

export type RevisionRespuesta = "SI" | "NO" | null;

export type RevisionExpedienteItem = {
  id: string;
  numero: number;
  texto: string;
};

/** Catálogo fijo A. Revisión de expediente — ampliar aquí para nuevas filas sin migración de columnas. */
export const REVISION_EXPEDIENTE_ITEMS: readonly RevisionExpedienteItem[] = [
  { id: "1", numero: 1, texto: "Copia Certificada del Acta de Nacimiento." },
  { id: "2", numero: 2, texto: "Cédula de Identidad (laminada y vigente), con copia fotostática a color, ampliada al 150%." },
  { id: "3", numero: 3, texto: "Registro de Información Fiscal (RIF) vigente." },
  {
    id: "4",
    numero: 4,
    texto:
      "Examen médico (rx de tórax, rx de columna, rx de rodilla, perfil 20, HIV, VDRL, prueba de embarazo, eco abdomino-pélvico (partes blandas) y gota gruesa)",
  },
  { id: "5", numero: 5, texto: "Examen físico." },
  { id: "6", numero: 6, texto: "Examen psicológico y psicotécnico." },
  {
    id: "7",
    numero: 7,
    texto: "Certificado de salud (validado por algún Centro de Salud de la FANB).",
  },
  {
    id: "8",
    numero: 8,
    texto:
      "Copia fotostática (fondo negro) del título de Licenciado (o equivalente) o de Técnico Superior Universitario, además de las notas certificadas originales. Ambos documentos deben estar suscritos por el Rector, el Secretario General o la autoridad competente designada, según el reglamento interno del Instituto Universitario.",
  },
  {
    id: "9",
    numero: 9,
    texto: "Constancia de haber cumplido con el artículo 8 de la Ley del Ejercicio de la Medicina. (En caso de ser médico).",
  },
  {
    id: "10",
    numero: 10,
    texto: "Estar inscrito en el colegio profesional respectivo, de ser aplicable.",
  },
  { id: "11", numero: 11, texto: "Currículo Vitae con los soportes respectivos." },
  {
    id: "12",
    numero: 12,
    texto: "Dos (02) referencias personales y dos (02) laborales, de ser aplicable.",
  },
  {
    id: "13",
    numero: 13,
    texto: "Constancia de Buena Conducta expedida por la Autoridad Civil o Consejo Comunal de su localidad.",
  },
  {
    id: "14",
    numero: 14,
    texto:
      "Constancia de Buena Conducta expedida por el Instituto Universitario, suscrito por el Rector o en su defecto el Secretario General.",
  },
  {
    id: "15",
    numero: 15,
    texto: "Partida de nacimiento de ambos progenitores, en caso de fallecimiento, presentar acta de defunción.",
  },
  {
    id: "16",
    numero: 16,
    texto:
      "Documento de Antecedentes Penales emitido por el Ministerio del Poder Popular para Relaciones Interiores, Justicia y Paz.",
  },
  {
    id: "17",
    numero: 17,
    texto:
      "Fotografía cuerpo completo, en traje de baño olímpico frontal y dorsal y tipo carnet con almilla blanca. (sobre)",
  },
  {
    id: "18",
    numero: 18,
    texto:
      "Inscripción en el Registro para la Defensa Integral, de acuerdo a la Ley de Alistamiento para la Defensa Integral de la Nación.",
  },
] as const;

export type PruebaFisicaFilaId =
  | "potencia_aerobica_2400m"
  | "flexiones_60"
  | "abdominales_60"
  | "barra_fija_dominada"
  | "natacion_50m"
  | "flotabilidad";

export type PruebaFisicaFilaDef = {
  id: PruebaFisicaFilaId;
  prueba: string;
  indicadorLabel: string;
  refMasculino: string;
  refFemenino: string;
  refPorcentaje: string;
  refSubtotal: string;
};

/** Catálogo B. Prueba física — indicadores de referencia en UI; valores del aspirante en JSON. */
export const PRUEBA_FISICA_FILAS: readonly PruebaFisicaFilaDef[] = [
  {
    id: "potencia_aerobica_2400m",
    prueba: "POTENCIA AERÓBICA (2.400 M)",
    indicadorLabel: "TIEMPO",
    refMasculino: "13min",
    refFemenino: "9:45min",
    refPorcentaje: "30",
    refSubtotal: "",
  },
  {
    id: "flexiones_60",
    prueba: "FLEXIONES (60″)",
    indicadorLabel: "N° FLEXIONES",
    refMasculino: "25",
    refFemenino: "35",
    refPorcentaje: "20",
    refSubtotal: "",
  },
  {
    id: "abdominales_60",
    prueba: "ABDOMINALES (60″)",
    indicadorLabel: "N° ABDOMINALES",
    refMasculino: "30",
    refFemenino: "50",
    refPorcentaje: "20",
    refSubtotal: "",
  },
  {
    id: "barra_fija_dominada",
    prueba: "BARRA FIJA DOMINADA",
    indicadorLabel: "CANTIDAD/TIEMPO",
    refMasculino: "17″",
    refFemenino: "10 (rep)",
    refPorcentaje: "10",
    refSubtotal: "",
  },
  {
    id: "natacion_50m",
    prueba: "NATACIÓN (50 M)",
    indicadorLabel: "METROS",
    refMasculino: "50m",
    refFemenino: "50m",
    refPorcentaje: "15",
    refSubtotal: "",
  },
  {
    id: "flotabilidad",
    prueba: "FLOTABILIDAD",
    indicadorLabel: "TIEMPO",
    refMasculino: "5min",
    refFemenino: "5min",
    refPorcentaje: "5",
    refSubtotal: "",
  },
] as const;

export type ExamenMedicoItem = {
  id: string;
  numero: number;
  texto: string;
};

/** Catálogo C. Examen médico — ampliar aquí para nuevas pruebas. */
export const EXAMEN_MEDICO_ITEMS: readonly ExamenMedicoItem[] = [
  { id: "1", numero: 1, texto: "PERFIL 20" },
  { id: "2", numero: 2, texto: "HIV" },
  { id: "3", numero: 3, texto: "VDRL" },
  { id: "4", numero: 4, texto: "PRUEBA DE EMBARAZO" },
  { id: "5", numero: 5, texto: "GOTA GRUESA" },
  { id: "6", numero: 6, texto: "RX TORAX" },
  { id: "7", numero: 7, texto: "RX DE COLUMNA" },
  { id: "8", numero: 8, texto: "RX DE RODILLA" },
  { id: "9", numero: 9, texto: "ECO ABSOMINO-PELVICO (PARTES BLANDAS)" },
  { id: "10", numero: 10, texto: "PRESENCIA DE TATUAJES" },
  { id: "11", numero: 11, texto: "PRESENCIA DE PERFORACIONES" },
] as const;

export type PruebaFisicaValoresFila = {
  datosM: string;
  datosF: string;
  calificacion: string;
  porcentaje: string;
  subtotal: string;
};

export type ExamenMedicoFila = {
  si: boolean;
  no: boolean;
  diagnostico: string;
};

export type FichaEvaluacionState = {
  v: typeof FICHA_EVALUACION_VERSION;
  revision: Record<string, RevisionRespuesta>;
  pruebaFisica: {
    filas: Record<string, PruebaFisicaValoresFila>;
    calificacionObtenida: string;
  };
  examenMedico: Record<string, ExamenMedicoFila>;
};

const revisionIds = new Set<string>(REVISION_EXPEDIENTE_ITEMS.map((r) => r.id));
const pruebaIds = new Set<string>(PRUEBA_FISICA_FILAS.map((r) => r.id));
const examenIds = new Set<string>(EXAMEN_MEDICO_ITEMS.map((r) => r.id));

function emptyFilaPrueba(): PruebaFisicaValoresFila {
  return { datosM: "", datosF: "", calificacion: "", porcentaje: "", subtotal: "" };
}

function emptyExamenFila(): ExamenMedicoFila {
  return { si: false, no: false, diagnostico: "" };
}

/** Estado inicial al crear un aspirante o si el JSON en BD es inválido. */
export function emptyFichaEvaluacion(): FichaEvaluacionState {
  const revision: Record<string, RevisionRespuesta> = {};
  for (const r of REVISION_EXPEDIENTE_ITEMS) revision[r.id] = null;

  const filas: Record<string, PruebaFisicaValoresFila> = {};
  for (const r of PRUEBA_FISICA_FILAS) filas[r.id] = emptyFilaPrueba();

  const examenMedico: Record<string, ExamenMedicoFila> = {};
  for (const r of EXAMEN_MEDICO_ITEMS) examenMedico[r.id] = emptyExamenFila();

  return {
    v: FICHA_EVALUACION_VERSION,
    revision,
    pruebaFisica: { filas, calificacionObtenida: "" },
    examenMedico,
  };
}

function trimShort(s: unknown, max: number): string {
  if (s == null) return "";
  const t = String(s).trim();
  return t.length > max ? t.slice(0, max) : t;
}

function parseRevisionRespuesta(v: unknown): RevisionRespuesta {
  if (v === "SI" || v === "NO") return v;
  return null;
}

function parseExamenFila(raw: unknown): ExamenMedicoFila {
  if (!raw || typeof raw !== "object") return emptyExamenFila();
  const o = raw as Record<string, unknown>;
  const diag = trimShort(o.diagnostico ?? o.observaciones, 2000);
  const si = o.si === true;
  const no = o.no === true;
  if (si && !no) return { si: true, no: false, diagnostico: diag };
  if (no && !si) return { si: false, no: true, diagnostico: diag };
  return { si: false, no: false, diagnostico: diag };
}

/** Normaliza datos desde BD u otro JSON parcial (tolerante a versiones futuras). */
export function parseFichaEvaluacion(raw: unknown): FichaEvaluacionState {
  const base = emptyFichaEvaluacion();
  if (!raw || typeof raw !== "object") return base;

  const o = raw as Record<string, unknown>;

  if (o.revision && typeof o.revision === "object") {
    for (const [k, v] of Object.entries(o.revision as Record<string, unknown>)) {
      if (!revisionIds.has(k)) continue;
      base.revision[k] = parseRevisionRespuesta(v);
    }
  }

  const pf = o.pruebaFisica;
  if (pf && typeof pf === "object") {
    const pfo = pf as Record<string, unknown>;
    base.pruebaFisica.calificacionObtenida = trimShort(pfo.calificacionObtenida, 500);
    const filas = pfo.filas;
    if (filas && typeof filas === "object") {
      for (const [k, row] of Object.entries(filas as Record<string, unknown>)) {
        if (!pruebaIds.has(k)) continue;
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        base.pruebaFisica.filas[k] = {
          datosM: trimShort(r.datosM ?? r.m ?? r.indicadorM, 120),
          datosF: trimShort(r.datosF ?? r.f ?? r.indicadorF, 120),
          calificacion: trimShort(r.calificacion, 120),
          porcentaje: trimShort(r.porcentaje, 40),
          subtotal: trimShort(r.subtotal, 40),
        };
      }
    }
  }

  if (o.examenMedico && typeof o.examenMedico === "object") {
    for (const [k, v] of Object.entries(o.examenMedico as Record<string, unknown>)) {
      if (!examenIds.has(k)) continue;
      base.examenMedico[k] = parseExamenFila(v);
    }
  }

  return base;
}

const revisionRespuestaSchema = z.union([z.literal("SI"), z.literal("NO"), z.null()]);

const pruebaFilaSchema = z.object({
  datosM: z.string().max(120).optional(),
  datosF: z.string().max(120).optional(),
  calificacion: z.string().max(120).optional(),
  porcentaje: z.string().max(40).optional(),
  subtotal: z.string().max(40).optional(),
});

const examenFilaSchema = z.object({
  si: z.boolean().optional(),
  no: z.boolean().optional(),
  diagnostico: z.string().max(2000).optional(),
});

export const fichaEvaluacionDbSchema = z
  .object({
    v: z.number().int().optional(),
    revision: z.record(z.string(), revisionRespuestaSchema.optional()).optional(),
    pruebaFisica: z
      .object({
        calificacionObtenida: z.string().max(500).optional(),
        filas: z.record(z.string(), pruebaFilaSchema.optional()).optional(),
      })
      .optional(),
    examenMedico: z.record(z.string(), examenFilaSchema.optional()).optional(),
  })
  .passthrough();

/** Valida y recorta el payload antes de persistir en Prisma. */
export function normalizeFichaEvaluacionForDb(input: unknown): FichaEvaluacionState {
  const parsed = fichaEvaluacionDbSchema.safeParse(input);
  if (!parsed.success) return emptyFichaEvaluacion();
  return parseFichaEvaluacion(parsed.data);
}

export function isFichaEvaluacionVacia(s: FichaEvaluacionState): boolean {
  const revOk = Object.values(s.revision).every((v) => v == null);
  const exOk = Object.values(s.examenMedico).every((r) => !r.si && !r.no && !r.diagnostico.trim());
  const filasOk = Object.values(s.pruebaFisica.filas).every(
    (f) =>
      !f.datosM.trim() &&
      !f.datosF.trim() &&
      !f.calificacion.trim() &&
      !f.porcentaje.trim() &&
      !f.subtotal.trim(),
  );
  const califOk = !s.pruebaFisica.calificacionObtenida.trim();
  return revOk && exOk && filasOk && califOk;
}
