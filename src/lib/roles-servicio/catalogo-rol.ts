import type { JerarquiaAutoridad } from "@src/generated/prisma";
import { foldBusqueda } from "@src/lib/text/fold";
import type { OrdenNocturnoConfig, TurnoNocturnoEtiqueta } from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";

export const CATEGORIAS_ROL = [
  { value: "OFICIAL", label: "Oficiales" },
  { value: "SANIDAD", label: "Sanidad" },
  { value: "INSPECCION", label: "Inspección" },
  { value: "CUARTEL", label: "Cuarteles" },
  { value: "BANO", label: "Baños" },
  { value: "COMEDOR", label: "Comedores" },
  { value: "AULA", label: "Aulas" },
  { value: "ESTACIONAMIENTO", label: "Estacionamiento" },
  { value: "OTROS", label: "Otro" },
] as const;

export const PAPELES_NOCTURNOS = [
  {
    value: "NINGUNO",
    label: "No entra de noche",
    detalle: "Solo aparece en el servicio del día.",
  },
  {
    value: "TURNO_1",
    label: "1.er turno",
    detalle: "Este rol es el primer turno del nocturno.",
  },
  {
    value: "TURNO_2",
    label: "2.do turno",
    detalle: "Este rol es el segundo turno del nocturno.",
  },
  {
    value: "TURNO_3",
    label: "3.er turno",
    detalle: "Este rol es el tercer turno del nocturno.",
  },
  {
    value: "RONDA",
    label: "Ronda",
    detalle: "Oficial de día en la noche.",
  },
  {
    value: "RONDIN",
    label: "Rondín",
    detalle: "Dos puestos de inspección en la noche.",
  },
  {
    value: "MARCA_TURNO",
    label: "Turnos en la celda",
    detalle: "Cada día se marca 1.er, 2.do y 3.er turno (estacionamiento).",
  },
] as const;

export type CategoriaRol = (typeof CATEGORIAS_ROL)[number]["value"];
export type PapelNocturno = (typeof PAPELES_NOCTURNOS)[number]["value"];

const TURNO_DE_PAPEL: Partial<Record<PapelNocturno, TurnoNocturnoEtiqueta>> = {
  TURNO_1: "1ER",
  TURNO_2: "2DO",
  TURNO_3: "3ER",
};

export function etiquetaCategoria(value: string): string {
  return CATEGORIAS_ROL.find((item) => item.value === value)?.label ?? "Otro";
}

export function etiquetaPapelNocturno(value: string): string {
  return PAPELES_NOCTURNOS.find((item) => item.value === value)?.label ?? "No entra de noche";
}

export function esCategoriaRol(value: string): value is CategoriaRol {
  return CATEGORIAS_ROL.some((item) => item.value === value);
}

export function esPapelNocturno(value: string): value is PapelNocturno {
  return PAPELES_NOCTURNOS.some((item) => item.value === value);
}

export function inferirCategoria(nombre: string): CategoriaRol {
  if (/oficial/i.test(nombre)) return "OFICIAL";
  if (/enfermer|medicin|sanidad/i.test(nombre)) return "SANIDAD";
  if (/inspecci/i.test(nombre)) return "INSPECCION";
  if (/cuarteler/i.test(nombre)) return "CUARTEL";
  if (/ba[nñ]o/i.test(nombre)) return "BANO";
  if (/comedor/i.test(nombre)) return "COMEDOR";
  if (/aula/i.test(nombre)) return "AULA";
  if (/estacionamiento/i.test(nombre)) return "ESTACIONAMIENTO";
  return "OTROS";
}

export function inferirPapelNocturno(nombre: string): PapelNocturno {
  if (/estacionamiento/i.test(nombre)) return "MARCA_TURNO";
  if (/oficial\s+de\s+d[ií]a/i.test(nombre)) return "RONDA";
  if (/inspecci/i.test(nombre)) return "RONDIN";
  if (/aula/i.test(nombre)) return "TURNO_1";
  if (/cuarteler/i.test(nombre)) return "TURNO_2";
  if (/ba[nñ]o/i.test(nombre)) return "TURNO_3";
  return "NINGUNO";
}

export function inferirConAutoridad(nombre: string, tieneAutoridad: boolean): boolean {
  if (tieneAutoridad) return true;
  return /oficial/i.test(nombre);
}

export function papelDesdeConfig(
  clave: string,
  config: OrdenNocturnoConfig,
): PapelNocturno | null {
  if (config.rondaRolClaves.includes(clave)) return "RONDA";
  if (config.rondinRolClaves.includes(clave)) return "RONDIN";
  for (const binomio of config.binomios) {
    if (!binomio.rolClaves.includes(clave)) continue;
    if (binomio.turno === "1ER") return "TURNO_1";
    if (binomio.turno === "2DO") return "TURNO_2";
    if (binomio.turno === "3ER") return "TURNO_3";
  }
  return null;
}

export function cuposSugeridos(nombre: string, papel: PapelNocturno, categoria: CategoriaRol): number {
  if (papel === "MARCA_TURNO" || categoria === "ESTACIONAMIENTO") return 3;
  if (papel === "RONDIN" || categoria === "INSPECCION" || /rond[ií]n|inspecci/i.test(nombre)) return 2;
  return 1;
}

export function marcasPorCupoDe(papel: PapelNocturno, cupos: number): string[] | undefined {
  if (papel !== "MARCA_TURNO") return undefined;
  const base = ["T1", "T2", "T3"];
  return Array.from({ length: Math.max(1, cupos) }, (_, index) => base[index] ?? "T1");
}

export function claveDeRol(nombre: string, curso: string): string {
  const clave = foldBusqueda(`${nombre} ${curso}`)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return clave || "rol";
}

export function gradoAutoridadCorto(jerarquia: JerarquiaAutoridad | string): string {
  switch (jerarquia) {
    case "CORONEL":
      return "CRNL";
    case "TENIENTE_CORONEL":
      return "TC";
    case "MAYOR":
      return "MY";
    case "CAPITAN":
      return "CAP";
    case "PRIMER_TENIENTE":
      return "PTTE";
    default:
      return "TNTE";
  }
}

export function quitarClaveNocturna(config: OrdenNocturnoConfig, clave: string): OrdenNocturnoConfig {
  return {
    ...config,
    rondaRolClaves: config.rondaRolClaves.filter((item) => item !== clave),
    rondinRolClaves: config.rondinRolClaves.filter((item) => item !== clave),
    binomios: config.binomios.map((binomio) => ({
      ...binomio,
      rolClaves: binomio.rolClaves.filter((item) => item !== clave),
    })),
  };
}

export function aplicarPapelNocturno(
  config: OrdenNocturnoConfig,
  clave: string,
  papel: PapelNocturno,
): OrdenNocturnoConfig {
  const limpio = quitarClaveNocturna(config, clave);
  if (papel === "NINGUNO" || papel === "MARCA_TURNO") return limpio;
  if (papel === "RONDA") {
    return { ...limpio, rondaRolClaves: [...limpio.rondaRolClaves, clave] };
  }
  if (papel === "RONDIN") {
    return { ...limpio, rondinRolClaves: [...limpio.rondinRolClaves, clave] };
  }
  const turno = TURNO_DE_PAPEL[papel];
  if (!turno) return limpio;
  const binomios = limpio.binomios.map((binomio) => ({ ...binomio, rolClaves: [...binomio.rolClaves] }));
  const indice = binomios.findIndex((binomio) => binomio.turno === turno);
  if (indice < 0) {
    binomios.push({
      id: `binomio-${turno.toLowerCase()}`,
      turno,
      servicioEtiqueta: "IMAGINARIA",
      rolClaves: [clave],
    });
  } else {
    const actual = binomios[indice]!;
    binomios[indice] = { ...actual, rolClaves: [...actual.rolClaves, clave] };
  }
  return { ...limpio, binomios };
}
