/**
 * Punto de entrada del dominio Orden del día.
 * Ampliar catálogos en `transcripciones.ts` y patrones en `clasificar-servicio.ts`.
 */
export {
  buildOrdenDelDia,
  DISPOSICION_GENERAL_DEFAULT,
  DISPOSICION_PARTICULAR_DEFAULT,
  DIRECTOR_CARGO_DEFAULT,
  DIRECTOR_GRADO_DEFAULT,
  LUGAR_ORDEN_DEFAULT,
  type BuildOrdenDelDiaInput,
  type FilaServicioDiurno,
  type FilaServicioNocturno,
  type OrdenDelDiaData,
  type PlanOrdenInput,
  type PersonaOrdenInput,
} from "@src/lib/roles-servicio/orden-del-dia/build-orden";

export {
  clasificarTurnoServicio,
  etiquetaTurnoServicio,
  type TurnoServicio,
} from "@src/lib/roles-servicio/orden-del-dia/clasificar-servicio";

export {
  aniversariosInstitucionales,
  diaAnterior,
  etiquetaDiaMesOrden,
  etiquetaFechaOrden,
  numeroOrdenDelDia,
  siguienteDia,
} from "@src/lib/roles-servicio/orden-del-dia/fechas";

export {
  listTranscripciones,
  trioTranscripcionesDelDia,
  transcripcionDelDia,
  TRANSCRIPCIONES_COMANDANTE,
  TRANSCRIPCIONES_LEY,
  TRANSCRIPCIONES_LIBERTADOR,
  type Transcripcion,
  type TranscripcionCategoria,
  type TrioTranscripcionesDia,
} from "@src/lib/roles-servicio/orden-del-dia/transcripciones";

export {
  citaParenteticaApa,
  textoCitaApa,
} from "@src/lib/roles-servicio/orden-del-dia/apa";

export {
  defaultOrdenNocturnoConfig,
  hidratarSugerenciasClaves,
  normalizeOrdenNocturnoConfig,
  type OrdenNocturnoConfig,
  type BinomioNocturnoConfig,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
