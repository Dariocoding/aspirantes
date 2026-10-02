import type {
  FilaServicioNocturno,
  PersonaOrdenInput,
  PlanOrdenInput,
} from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import type { OrdenNocturnoConfig } from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import { labelJerarquiaAutoridad } from "@src/lib/roles-servicio/jerarquia-autoridad";

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

function personasDeRolesEnDia(
  planes: PlanOrdenInput[],
  claves: string[],
  dia: number,
): Array<{ plan: PlanOrdenInput; persona: PersonaOrdenInput }> {
  if (claves.length === 0) return [];
  const set = new Set(claves);
  const filas: Array<{ plan: PlanOrdenInput; persona: PersonaOrdenInput }> = [];
  for (const plan of planes) {
    if (!set.has(plan.clave)) continue;
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

/**
 * Arma la tabla nocturna según config:
 * 1) RONDA = personal del rol «oficial de día» (u otros elegidos) ese día.
 * 2) Binomios: cada turno (1ER/2DO/3ER) toma el personal de los roles fuente
 *    (aula / cuartelero / baño por defecto).
 */
export function construirFilasNocturnas(
  planes: PlanOrdenInput[],
  dia: number,
  config: OrdenNocturnoConfig,
): FilaServicioNocturno[] {
  const filas: FilaServicioNocturno[] = [];
  let nro = 1;

  const ronda = personasDeRolesEnDia(planes, config.rondaRolClaves, dia);
  if (ronda.length === 0 && config.rondaRolClaves.length > 0) {
    filas.push({
      nro: nro++,
      turno: config.rondaTurno,
      servicio: config.rondaServicioEtiqueta.toUpperCase(),
      grado: "—",
      nombres: OMITIR,
    });
  } else {
    for (const { persona } of ronda) {
      filas.push({
        nro: nro++,
        turno: config.rondaTurno,
        servicio: config.rondaServicioEtiqueta.toUpperCase(),
        grado: gradoMostrado(persona),
        nombres: nombreMostrado(persona),
      });
    }
  }

  for (const binomio of config.binomios) {
    const personas = personasDeRolesEnDia(planes, binomio.rolClaves, dia);
    const etiquetaBase = binomio.servicioEtiqueta.trim().toUpperCase();

    if (personas.length === 0) {
      if (binomio.rolClaves.length === 0) continue;
      filas.push({
        nro: nro++,
        turno: binomio.turno,
        servicio: etiquetaBase || "IMAGINARIA",
        grado: "—",
        nombres: OMITIR,
      });
      continue;
    }

    for (const { plan, persona } of personas) {
      const servicio = etiquetaServicioBinomio(etiquetaBase, plan.nombre);
      filas.push({
        nro: nro++,
        turno: binomio.turno,
        servicio,
        grado: gradoMostrado(persona),
        nombres: nombreMostrado(persona),
      });
    }
  }

  return filas;
}

function etiquetaServicioBinomio(etiquetaBase: string, nombreRol: string): string {
  if (!etiquetaBase) return nombreRol.toUpperCase();
  const fem = /femenin/i.test(nombreRol);
  const masc = /masculin/i.test(nombreRol);
  if (fem) return `${etiquetaBase} FEMENINA`;
  if (masc) return `${etiquetaBase} MASCULINO`;
  return etiquetaBase;
}
