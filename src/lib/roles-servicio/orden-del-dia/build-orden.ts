import {
  clasificarTurnoServicio,
  type TurnoServicio,
} from "@src/lib/roles-servicio/orden-del-dia/clasificar-servicio";
import { construirFilasNocturnas } from "@src/lib/roles-servicio/orden-del-dia/armar-nocturnos";
import {
  defaultOrdenNocturnoConfig,
  hidratarSugerenciasClaves,
  type OrdenNocturnoConfig,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import {
  aniversariosInstitucionales,
  etiquetaFechaOrden,
  numeroOrdenDelDia,
  siguienteDia,
} from "@src/lib/roles-servicio/orden-del-dia/fechas";
import {
  trioTranscripcionesDelDia,
  type Transcripcion,
} from "@src/lib/roles-servicio/orden-del-dia/transcripciones";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import { labelJerarquiaAutoridad } from "@src/lib/roles-servicio/jerarquia-autoridad";
import type { JerarquiaAutoridad } from "@src/generated/prisma";
import { PLANTILLA_MEMBRETE_CEFOA45 } from "@src/lib/membrete";

export type PersonaOrdenInput = {
  orden: number;
  grado: string;
  nombre: string;
  dias: MarcaDia[];
  aspirante: {
    nombres: string;
    apellidos: string;
  } | null;
  autoridad: {
    nombres: string;
    apellidos: string;
    jerarquia: JerarquiaAutoridad;
  } | null;
};

export type PlanOrdenInput = {
  clave: string;
  nombre: string;
  curso: string;
  asignaciones: PersonaOrdenInput[];
};

export type FilaServicioDiurno = {
  nro: number;
  servicio: string;
  grado: string;
  nombres: string;
};

export type FilaServicioNocturno = {
  nro: number;
  turno: string;
  servicio: string;
  grado: string;
  nombres: string;
};

export type OrdenDelDiaData = {
  anio: number;
  mes: number;
  dia: number;
  numeroOrden: number;
  lineasMembrete: string[];
  lugar: string;
  fechaDocumento: string;
  aniversarios: {
    independencia: number;
    federacion: number;
    revolucion: number;
  };
  transcripciones: {
    libertador: Transcripcion;
    comandante: Transcripcion;
    ley: Transcripcion;
  };
  diurnosTitulo: string;
  nocturnosTitulo: string;
  diurnos: FilaServicioDiurno[];
  nocturnos: FilaServicioNocturno[];
  disposicionGeneral: string;
  disposicionParticular: string;
  directorNombre: string;
  directorGrado: string;
  directorCargo: string;
};

export const LUGAR_ORDEN_DEFAULT =
  'LICEO MILITAR "GRAN MARISCAL DE AYACUCHO"';

export const DISPOSICION_GENERAL_DEFAULT =
  "SE RECUERDA A TODO EL PERSONAL LA OBLIGACIÓN DE SER DILIGENTE EN LA CONSERVACIÓN DEL ARMAMENTO, MUNICIONES, EQUIPOS, VEHÍCULOS, UNIFORMES Y DEMÁS BIENES ASIGNADOS AL SERVICIO. EL DESCUIDO U OMISIÓN EN EL CUIDADO DE ESTOS BIENES CONSTITUYE FALTA LEVE, SIN PERJUICIO DE LAS RESPONSABILIDADES A QUE HUBIERE LUGAR.";

export const DISPOSICION_PARTICULAR_DEFAULT = "NINGUNA";

export const DIRECTOR_CARGO_DEFAULT =
  "DIRECTOR DEL CURSO ESPECIAL DE FORMACIÓN DE OFICIALES EN LA CATEGORÍA DE ASIMILADO Y ASIMILADO TÉCNICO";

export const DIRECTOR_GRADO_DEFAULT = "CORONEL";

const OMITIR = "OMITIR";

function marcaDelDia(dias: MarcaDia[], dia: number): string | null {
  return dias.find((item) => item.dia === dia)?.marca ?? null;
}

function nombreMostrado(persona: PersonaOrdenInput): string {
  if (persona.aspirante) {
    return `${persona.aspirante.nombres} ${persona.aspirante.apellidos}`.trim().toUpperCase();
  }
  if (persona.autoridad) {
    return `${persona.autoridad.nombres} ${persona.autoridad.apellidos}`.trim().toUpperCase();
  }
  const crudo = persona.nombre.trim();
  return crudo ? crudo.toUpperCase() : OMITIR;
}

function gradoMostrado(persona: PersonaOrdenInput): string {
  if (persona.autoridad) {
    return labelJerarquiaAutoridad(persona.autoridad.jerarquia).toUpperCase();
  }
  return persona.grado.trim().toUpperCase() || "—";
}

function filasDelDia(
  planes: PlanOrdenInput[],
  dia: number,
  turno: TurnoServicio,
): Array<{ plan: PlanOrdenInput; persona: PersonaOrdenInput }> {
  const filas: Array<{ plan: PlanOrdenInput; persona: PersonaOrdenInput }> = [];
  for (const plan of planes) {
    if (clasificarTurnoServicio(plan.nombre) !== turno) continue;
    for (const persona of plan.asignaciones) {
      if (!marcaDelDia(persona.dias, dia)) continue;
      filas.push({ plan, persona });
    }
  }
  filas.sort((a, b) => {
    const porRol = a.plan.nombre.localeCompare(b.plan.nombre, "es");
    if (porRol !== 0) return porRol;
    return a.persona.orden - b.persona.orden;
  });
  return filas;
}

export type BuildOrdenDelDiaInput = {
  anio: number;
  mes: number;
  dia: number;
  planes: PlanOrdenInput[];
  planesManana?: PlanOrdenInput[];
  lineasMembrete?: string[];
  lugar?: string;
  directorNombre?: string | null;
  directorGrado?: string | null;
  directorCargo?: string | null;
  disposicionGeneral?: string;
  disposicionParticular?: string;
  nocturnoConfig?: OrdenNocturnoConfig;
};

export function buildOrdenDelDia(input: BuildOrdenDelDiaInput): OrdenDelDiaData {
  const { anio, mes, dia } = input;
  const manana = siguienteDia(anio, mes, dia);
  const planesManana =
    manana && manana.mes === mes && manana.anio === anio
      ? input.planes
      : (input.planesManana ?? input.planes);

  const diaDiurno = manana?.dia ?? dia;
  const anioDiurno = manana?.anio ?? anio;
  const mesDiurno = manana?.mes ?? mes;

  const rawDiurnos = filasDelDia(planesManana, diaDiurno, "diurno");

  const configNocturna = hidratarSugerenciasClaves(
    input.nocturnoConfig ?? defaultOrdenNocturnoConfig(),
    input.planes,
  );
  const nocturnos = construirFilasNocturnas(input.planes, dia, configNocturna);

  const diurnos: FilaServicioDiurno[] = rawDiurnos.map((fila, index) => ({
    nro: index + 1,
    servicio: fila.plan.nombre.toUpperCase(),
    grado: gradoMostrado(fila.persona),
    nombres: nombreMostrado(fila.persona),
  }));

  const lineas =
    input.lineasMembrete && input.lineasMembrete.length > 0
      ? input.lineasMembrete.map((l) => l.toUpperCase())
      : [...PLANTILLA_MEMBRETE_CEFOA45].map((l) => l.toUpperCase());

  return {
    anio,
    mes,
    dia,
    numeroOrden: numeroOrdenDelDia(anio, mes, dia),
    lineasMembrete: lineas,
    lugar: (input.lugar ?? LUGAR_ORDEN_DEFAULT).toUpperCase(),
    fechaDocumento: etiquetaFechaOrden(anio, mes, dia),
    aniversarios: aniversariosInstitucionales(anio),
    transcripciones: trioTranscripcionesDelDia(anio, mes, dia),
    diurnosTitulo: `1. DIURNOS PARA MAÑANA ${etiquetaFechaOrden(anioDiurno, mesDiurno, diaDiurno)}.`,
    nocturnosTitulo: `2. NOCTURNO PARA ESTE ${etiquetaFechaOrden(anio, mes, dia)}.`,
    diurnos,
    nocturnos,
    disposicionGeneral: input.disposicionGeneral ?? DISPOSICION_GENERAL_DEFAULT,
    disposicionParticular: input.disposicionParticular ?? DISPOSICION_PARTICULAR_DEFAULT,
    directorNombre: (input.directorNombre?.trim() || "DIRECTOR DEL CURSO").toUpperCase(),
    directorGrado: (input.directorGrado?.trim() || DIRECTOR_GRADO_DEFAULT).toUpperCase(),
    directorCargo: (input.directorCargo?.trim() || DIRECTOR_CARGO_DEFAULT).toUpperCase(),
  };
}
