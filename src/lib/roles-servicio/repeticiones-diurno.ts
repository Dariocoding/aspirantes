import { clavePersona, type PersonaClave } from "@src/lib/roles-servicio/generar-rotacion";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import { clasificarTurnoServicio } from "@src/lib/roles-servicio/orden-del-dia/clasificar-servicio";
import { planUsaTurnoEnMarca } from "@src/lib/roles-servicio/turnos-marca";

export type AsignacionDiurno = {
  id: string;
  orden: number;
  grado: string;
  nombre: string;
  etiqueta: string;
  aspiranteId: string | null;
  autoridadId: string | null;
  dias: MarcaDia[];
};

export type PlanDiurno = {
  clave: string;
  nombre: string;
  turnoEnMarca?: boolean;
  asignaciones: AsignacionDiurno[];
};

export type RepeticionDiurna = {
  dia: number;
  clave: string;
  nombre: string;
  puestos: Array<{
    planClave: string;
    planNombre: string;
    asignacionId: string;
    marca: string;
  }>;
};

export type SugerenciaRelevoDiurno = {
  dia: number;
  nombre: string;
  seQuedaEn: string;
  moverDe: {
    planClave: string;
    planNombre: string;
    asignacionId: string;
    marca: string;
  };
  relevo: { asignacionId: string; nombre: string; grado: string } | null;
};

type PlanEntrada = {
  clave: string;
  nombre: string;
  turnoEnMarca?: boolean;
  asignaciones: Array<{
    id: string;
    orden: number;
    grado: string;
    nombre: string;
    dias: MarcaDia[];
    aspirante: { id: string; nombres: string; apellidos: string } | null;
    autoridad: { id: string; nombres: string; apellidos: string } | null;
  }>;
};

/** Misma noción de diurno que la orden del día. Estacionamiento no cuenta. */
export function esGuardiaDiurna(plan: { nombre: string; turnoEnMarca?: boolean }): boolean {
  if (planUsaTurnoEnMarca(plan)) return false;
  return clasificarTurnoServicio(plan.nombre) === "diurno";
}

export function aPlanDiurno(planes: PlanEntrada[]): PlanDiurno[] {
  return planes.map((plan) => ({
    clave: plan.clave,
    nombre: plan.nombre,
    turnoEnMarca: plan.turnoEnMarca,
    asignaciones: plan.asignaciones.map((asignacion) => ({
      id: asignacion.id,
      orden: asignacion.orden,
      grado: asignacion.grado,
      nombre: asignacion.nombre,
      etiqueta: etiquetaDe(asignacion),
      aspiranteId: asignacion.aspirante?.id ?? null,
      autoridadId: asignacion.autoridad?.id ?? null,
      dias: asignacion.dias,
    })),
  }));
}

function etiquetaDe(asignacion: PlanEntrada["asignaciones"][number]): string {
  if (asignacion.aspirante) {
    return `${asignacion.aspirante.nombres} ${asignacion.aspirante.apellidos}`.trim();
  }
  if (asignacion.autoridad) {
    return `${asignacion.autoridad.nombres} ${asignacion.autoridad.apellidos}`.trim();
  }
  return asignacion.nombre.trim() || "Sin nombre";
}

function personaDe(asignacion: AsignacionDiurno): PersonaClave {
  return {
    asignacionId: asignacion.id,
    aspiranteId: asignacion.aspiranteId,
    autoridadId: asignacion.autoridadId,
    nombre: asignacion.nombre,
  };
}

/** Oficial de día, inspección, medicina y enfermería se conservan antes que el resto. */
function prioridadRol(nombre: string): number {
  if (/oficial\s+de\s+d[ií]a/i.test(nombre)) return 0;
  if (/inspecci[oó]n/i.test(nombre)) return 1;
  if (/medicina/i.test(nombre)) return 2;
  if (/enfermer/i.test(nombre)) return 3;
  return 100;
}

type Puesto = {
  planClave: string;
  planNombre: string;
  prioridad: number;
  asignacionId: string;
  orden: number;
  marca: string;
  etiqueta: string;
  clave: string;
};

function clonarMarcas(planes: PlanDiurno[]): Map<string, MarcaDia[]> {
  const mapa = new Map<string, MarcaDia[]>();
  for (const plan of planes) {
    for (const asignacion of plan.asignaciones) {
      mapa.set(
        asignacion.id,
        asignacion.dias.map((item) => ({ dia: item.dia, marca: item.marca })),
      );
    }
  }
  return mapa;
}

function marcaEn(marcas: Map<string, MarcaDia[]>, asignacionId: string, dia: number): string | null {
  return marcas.get(asignacionId)?.find((item) => item.dia === dia)?.marca ?? null;
}

function escribirMarca(
  marcas: Map<string, MarcaDia[]>,
  asignacionId: string,
  dia: number,
  marca: string | null,
) {
  const previas = (marcas.get(asignacionId) ?? []).filter((item) => item.dia !== dia);
  const next = marca ? [...previas, { dia, marca }].sort((a, b) => a.dia - b.dia) : previas;
  marcas.set(asignacionId, next);
}

function puestosDelDia(planes: PlanDiurno[], marcas: Map<string, MarcaDia[]>, dia: number): Puesto[] {
  const puestos: Puesto[] = [];
  for (const plan of planes) {
    if (!esGuardiaDiurna(plan)) continue;
    for (const asignacion of plan.asignaciones) {
      const marca = marcaEn(marcas, asignacion.id, dia);
      if (!marca) continue;
      puestos.push({
        planClave: plan.clave,
        planNombre: plan.nombre,
        prioridad: prioridadRol(plan.nombre),
        asignacionId: asignacion.id,
        orden: asignacion.orden,
        marca,
        etiqueta: asignacion.etiqueta,
        clave: clavePersona(personaDe(asignacion)),
      });
    }
  }
  return puestos;
}

function ordenarPuestos(puestos: Puesto[]): Puesto[] {
  return [...puestos].sort(
    (a, b) =>
      a.prioridad - b.prioridad ||
      a.planNombre.localeCompare(b.planNombre, "es") ||
      a.orden - b.orden,
  );
}

export function detectarRepeticionesDiurnas(planes: PlanDiurno[]): RepeticionDiurna[] {
  const marcas = clonarMarcas(planes);
  const dias = diasConMarcaDiurna(planes, marcas);
  const repeticiones: RepeticionDiurna[] = [];
  for (const dia of dias) {
    const grupos = new Map<string, Puesto[]>();
    for (const puesto of puestosDelDia(planes, marcas, dia)) {
      const lista = grupos.get(puesto.clave) ?? [];
      lista.push(puesto);
      grupos.set(puesto.clave, lista);
    }
    for (const [clave, puestos] of grupos) {
      if (puestos.length < 2) continue;
      const ordenados = ordenarPuestos(puestos);
      repeticiones.push({
        dia,
        clave,
        nombre: ordenados[0]!.etiqueta,
        puestos: ordenados.map((puesto) => ({
          planClave: puesto.planClave,
          planNombre: puesto.planNombre,
          asignacionId: puesto.asignacionId,
          marca: puesto.marca,
        })),
      });
    }
  }
  return repeticiones;
}

function diasConMarcaDiurna(planes: PlanDiurno[], marcas: Map<string, MarcaDia[]>): number[] {
  const dias = new Set<number>();
  for (const plan of planes) {
    if (!esGuardiaDiurna(plan)) continue;
    for (const asignacion of plan.asignaciones) {
      for (const marca of marcas.get(asignacion.id) ?? []) dias.add(marca.dia);
    }
  }
  return [...dias].sort((a, b) => a - b);
}

function ultimoDiaAntes(
  planes: PlanDiurno[],
  marcas: Map<string, MarcaDia[]>,
  clave: string,
  dia: number,
): number | null {
  let ultimo: number | null = null;
  for (const plan of planes) {
    if (!esGuardiaDiurna(plan)) continue;
    for (const asignacion of plan.asignaciones) {
      if (clavePersona(personaDe(asignacion)) !== clave) continue;
      for (const marca of marcas.get(asignacion.id) ?? []) {
        if (marca.dia >= dia) continue;
        if (ultimo == null || marca.dia > ultimo) ultimo = marca.dia;
      }
    }
  }
  return ultimo;
}

/**
 * Deja a la persona en la guardia diurna de mayor prioridad y propone
 * un relevo del mismo rol que esté libre ese día.
 */
export function sugerirRelevosDiurnos(planes: PlanDiurno[]): SugerenciaRelevoDiurno[] {
  const marcas = clonarMarcas(planes);
  const sugerencias: SugerenciaRelevoDiurno[] = [];

  for (const dia of diasConMarcaDiurna(planes, marcas)) {
    const grupos = new Map<string, Puesto[]>();
    for (const puesto of puestosDelDia(planes, marcas, dia)) {
      const lista = grupos.get(puesto.clave) ?? [];
      lista.push(puesto);
      grupos.set(puesto.clave, lista);
    }

    const claves = [...grupos.entries()]
      .filter(([, puestos]) => puestos.length >= 2)
      .sort((a, b) => a[1][0]!.etiqueta.localeCompare(b[1][0]!.etiqueta, "es"));

    for (const [, puestos] of claves) {
      const ordenados = ordenarPuestos(puestos);
      const seQueda = ordenados[0]!;
      for (const extra of ordenados.slice(1)) {
        const plan = planes.find((item) => item.clave === extra.planClave);
        const ocupadas = new Set(puestosDelDia(planes, marcas, dia).map((puesto) => puesto.clave));
        let relevo: AsignacionDiurno | null = null;
        let mejorHueco = -1;
        for (const candidata of plan?.asignaciones ?? []) {
          const clave = clavePersona(personaDe(candidata));
          if (clave === extra.clave) continue;
          if (marcaEn(marcas, candidata.id, dia)) continue;
          if (ocupadas.has(clave)) continue;
          const ultimo = ultimoDiaAntes(planes, marcas, clave, dia);
          const hueco = ultimo == null ? Number.POSITIVE_INFINITY : dia - ultimo;
          if (
            !relevo ||
            hueco > mejorHueco ||
            (hueco === mejorHueco && candidata.orden < relevo.orden)
          ) {
            relevo = candidata;
            mejorHueco = hueco;
          }
        }

        const sugerencia: SugerenciaRelevoDiurno = {
          dia,
          nombre: seQueda.etiqueta,
          seQuedaEn: seQueda.planNombre,
          moverDe: {
            planClave: extra.planClave,
            planNombre: extra.planNombre,
            asignacionId: extra.asignacionId,
            marca: extra.marca,
          },
          relevo: relevo
            ? { asignacionId: relevo.id, nombre: relevo.etiqueta, grado: relevo.grado }
            : null,
        };
        sugerencias.push(sugerencia);
        if (!relevo) continue;
        escribirMarca(marcas, extra.asignacionId, dia, null);
        escribirMarca(marcas, relevo.id, dia, extra.marca);
      }
    }
  }

  return sugerencias;
}

export function mensajeChoqueDiurno(
  planes: PlanDiurno[],
  asignacionId: string,
  dia: number,
): string | null {
  let destino: { plan: PlanDiurno; asignacion: AsignacionDiurno } | null = null;
  for (const plan of planes) {
    const asignacion = plan.asignaciones.find((item) => item.id === asignacionId);
    if (asignacion) destino = { plan, asignacion };
  }
  if (!destino || !esGuardiaDiurna(destino.plan)) return null;

  const clave = clavePersona(personaDe(destino.asignacion));
  const otros: string[] = [];
  for (const plan of planes) {
    if (!esGuardiaDiurna(plan)) continue;
    for (const asignacion of plan.asignaciones) {
      if (asignacion.id === asignacionId) continue;
      if (!asignacion.dias.some((item) => item.dia === dia)) continue;
      if (clavePersona(personaDe(asignacion)) !== clave) continue;
      otros.push(plan.nombre);
    }
  }
  if (otros.length === 0) return null;
  return `Ya tiene guardia diurna ese día en ${otros.join(", ")}.`;
}

export function cambiosAlAplicarSugerencias(
  planes: PlanDiurno[],
  sugerencias: SugerenciaRelevoDiurno[],
): Array<{ asignacionId: string; dias: MarcaDia[] }> {
  const marcas = clonarMarcas(planes);
  const tocadas = new Set<string>();
  for (const sugerencia of sugerencias) {
    if (!sugerencia.relevo) continue;
    escribirMarca(marcas, sugerencia.moverDe.asignacionId, sugerencia.dia, null);
    escribirMarca(marcas, sugerencia.relevo.asignacionId, sugerencia.dia, sugerencia.moverDe.marca);
    tocadas.add(sugerencia.moverDe.asignacionId);
    tocadas.add(sugerencia.relevo.asignacionId);
  }
  return [...tocadas].map((asignacionId) => ({
    asignacionId,
    dias: marcas.get(asignacionId) ?? [],
  }));
}
