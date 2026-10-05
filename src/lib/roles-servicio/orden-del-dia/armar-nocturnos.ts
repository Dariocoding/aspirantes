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

function etiquetaServicioBinomio(etiquetaBase: string, nombreRol: string): string {
  if (!etiquetaBase) return nombreRol.toUpperCase();
  // Mantenimiento al aula y comedor no llevan sexo en el título.
  if (/mantenimiento\s+al\s+aula|comedor/i.test(nombreRol)) return etiquetaBase;
  const fem = /femenin/i.test(nombreRol);
  const masc = /masculin/i.test(nombreRol);
  if (fem) return `${etiquetaBase} FEMENINA`;
  if (masc) return `${etiquetaBase} MASCULINO`;
  return etiquetaBase;
}

function filasDeBloqueFijo(input: {
  planes: PlanOrdenInput[];
  dia: number;
  rolClaves: string[];
  servicioEtiqueta: string;
  turno: string;
  /** Mínimo de filas (completa con OMITIR si faltan personas). */
  minimoFilas?: number;
}): FilaServicioNocturno[] {
  const etiqueta = input.servicioEtiqueta.toUpperCase() || "SERVICIO";
  const minimo = Math.max(0, input.minimoFilas ?? 0);
  const personas = personasDeRolesEnDia(input.planes, input.rolClaves, input.dia);

  if (input.rolClaves.length === 0 && minimo === 0) return [];

  const filas: FilaServicioNocturno[] = personas.map(({ persona }) => ({
    nro: 0,
    turno: input.turno,
    servicio: etiqueta,
    grado: gradoMostrado(persona),
    nombres: nombreMostrado(persona),
  }));

  while (filas.length < minimo) {
    filas.push({
      nro: 0,
      turno: input.turno,
      servicio: etiqueta,
      grado: "—",
      nombres: OMITIR,
    });
  }

  if (filas.length === 0 && input.rolClaves.length > 0) {
    filas.push({
      nro: 0,
      turno: input.turno,
      servicio: etiqueta,
      grado: "—",
      nombres: OMITIR,
    });
  }

  return filas;
}

/**
 * Arma la tabla nocturna según config:
 * 1) RONDA (= oficial de día)
 * 2) RONDIN ×2 (= inspección, 1.er turno)
 * 3) Binomios: imaginaria por turno (aula / cuartelero / baño)
 */
export function construirFilasNocturnas(
  planes: PlanOrdenInput[],
  dia: number,
  config: OrdenNocturnoConfig,
): FilaServicioNocturno[] {
  const filasRonda = filasDeBloqueFijo({
    planes,
    dia,
    rolClaves: config.rondaRolClaves,
    servicioEtiqueta: config.rondaServicioEtiqueta || "RONDA",
    turno: config.rondaTurno,
  });

  const filasRondin = filasDeBloqueFijo({
    planes,
    dia,
    rolClaves: config.rondinRolClaves,
    servicioEtiqueta: config.rondinServicioEtiqueta || "RONDIN",
    turno: config.rondinTurno,
    minimoFilas: 2,
  });

  const filasBinomio: FilaServicioNocturno[] = [];
  for (const binomio of config.binomios) {
    const personas = personasDeRolesEnDia(planes, binomio.rolClaves, dia);
    const etiquetaBase = binomio.servicioEtiqueta.trim().toUpperCase();

    if (personas.length === 0) {
      if (binomio.rolClaves.length === 0) continue;
      filasBinomio.push({
        nro: 0,
        turno: binomio.turno,
        servicio: etiquetaBase || "IMAGINARIA",
        grado: "—",
        nombres: OMITIR,
      });
      continue;
    }

    for (const { plan, persona } of personas) {
      const servicio = etiquetaServicioBinomio(etiquetaBase, plan.nombre);
      filasBinomio.push({
        nro: 0,
        turno: binomio.turno,
        servicio,
        grado: gradoMostrado(persona),
        nombres: nombreMostrado(persona),
      });
    }
  }

  return [...filasRonda, ...filasRondin, ...filasBinomio].map((fila, index) => ({
    ...fila,
    nro: index + 1,
  }));
}
