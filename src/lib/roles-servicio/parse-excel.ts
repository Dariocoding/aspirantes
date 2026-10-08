import ExcelJS from "exceljs";
import { foldBusqueda } from "@src/lib/text/fold";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";
import { esRolConTurnoEnMarca } from "@src/lib/roles-servicio/turnos-marca";

export type PersonaRolParseada = {
  orden: number;
  grado: string;
  nombre: string;
  dias: MarcaDia[];
};

export type RolParseado = {
  clave: string;
  nombre: string;
  curso: string;
  sortOrder: number;
  personas: PersonaRolParseada[];
};

export type LibroRolesParseado = {
  anio: number;
  mes: number;
  roles: RolParseado[];
};

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

function textoCelda(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).replace(/\s+/g, " ").trim();
  }
  if (value instanceof Date) return "";
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((parte) => parte.text)
        .join("")
        .replace(/\s+/g, " ")
        .trim();
    }
    if ("text" in value && typeof value.text === "string") return value.text.replace(/\s+/g, " ").trim();
    if ("result" in value && value.result != null && typeof value.result !== "object") {
      return String(value.result).replace(/\s+/g, " ").trim();
    }
  }
  return "";
}

function claveDe(nombre: string, curso: string): string {
  return foldBusqueda(`${nombre} ${curso}`)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function detectarMesAnio(texto: string): { mes: number; anio: number } | null {
  const hallado = texto.match(new RegExp(`(?:MES\\s+DE\\s+)?(${MESES.join("|")})[,\\s]+(\\d{4})`, "i"));
  if (!hallado?.[1] || !hallado[2]) return null;
  return {
    mes: MESES.indexOf(hallado[1].toUpperCase()) + 1,
    anio: Number(hallado[2]),
  };
}

function tituloRol(texto: string): { nombre: string; curso: string } | null {
  const normalizado = texto.replace(/\s+/g, " ").trim();
  if (!/^ROL DE SERVICIO\b/i.test(normalizado)) return null;

  const cursoMatch = normalizado.match(/CEFOA\s*N[°ºªo.]?\s*(\d+)/i);
  const curso = cursoMatch?.[1] ? `CEFOA ${cursoMatch[1]}` : "CEFOA 46";

  let nombre = normalizado
    .replace(/^ROL DE SERVICIO\s+(?:DE(?:L)?\s+)?/i, "")
    .replace(/\s*CEFOA\s*N[°ºªo.]?\s*\d+/gi, " ")
    .replace(/\s*(?:CORRESPONDIENTE\s+AL\s+)?(?:DEL\s+)?MES\s+DE\s+(?:ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+\d{4}\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!nombre) return null;
  return { nombre, curso };
}

/** Busca una fila con días consecutivos 1, 2, 3… y devuelve col → día. */
function mapaDias(row: ExcelJS.Row): Map<number, number> | null {
  const maxCol = Math.max(row.cellCount, 45);
  for (let inicio = 1; inicio <= maxCol - 1; inicio++) {
    if (textoCelda(row.getCell(inicio)) !== "1") continue;
    if (textoCelda(row.getCell(inicio + 1)) !== "2") continue;

    const mapa = new Map<number, number>();
    for (let col = inicio; col <= maxCol; col++) {
      const texto = textoCelda(row.getCell(col));
      if (!/^\d+$/.test(texto)) break;
      const dia = Number(texto);
      if (dia < 1 || dia > 31) break;
      mapa.set(col, dia);
    }
    if (mapa.size >= 28) return mapa;
  }
  return null;
}

function esPersona(numero: string, grado: string): boolean {
  return /^\d+$/.test(numero) && grado.length > 0 && !/grado|nombres|n[º°]/i.test(grado);
}

function textoFila(row: ExcelJS.Row, maxCol = 40): string[] {
  const celdas: string[] = [];
  for (let col = 1; col <= maxCol; col++) {
    const texto = textoCelda(row.getCell(col));
    if (texto) celdas.push(texto);
  }
  return celdas;
}

function cuentaMarcaX(rol: RolParseado): number {
  let total = 0;
  for (const persona of rol.personas) {
    for (const dia of persona.dias) {
      if (dia.marca === "X") total += 1;
    }
  }
  return total;
}

/**
 * El libro trae dos hojas con el mismo título (borrador con X y rol limpio).
 * En guardia de estacionamiento la X no es servicio: se queda la hoja sin X.
 * En el resto, si hubiera duplicado, gana la última hoja.
 */
export function deduplicarRoles(roles: RolParseado[]): RolParseado[] {
  const grupos = new Map<string, RolParseado[]>();
  for (const rol of roles) {
    const lista = grupos.get(rol.clave) ?? [];
    lista.push(rol);
    grupos.set(rol.clave, lista);
  }

  const vistos = new Set<string>();
  const resultado: RolParseado[] = [];
  for (const rol of roles) {
    if (vistos.has(rol.clave)) continue;
    vistos.add(rol.clave);
    const grupo = grupos.get(rol.clave) ?? [rol];
    const elegido = esRolConTurnoEnMarca(rol.nombre)
      ? grupo.reduce((mejor, actual) =>
          cuentaMarcaX(actual) <= cuentaMarcaX(mejor) ? actual : mejor,
        )
      : grupo[grupo.length - 1]!;
    const personas = esRolConTurnoEnMarca(elegido.nombre)
      ? elegido.personas.map((persona) => ({
          ...persona,
          dias: persona.dias.filter((dia) => dia.marca !== "X"),
        }))
      : elegido.personas;
    resultado.push({ ...elegido, personas, sortOrder: resultado.length });
  }
  return resultado;
}

export async function parsearRolesExcel(ruta: string): Promise<LibroRolesParseado> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(ruta);

  let anio = 2026;
  let mes = 10;
  const roles: RolParseado[] = [];

  for (const hoja of libro.worksheets) {
    let actual: RolParseado | null = null;
    let dias = new Map<number, number>();
    /** Columna del Nº de persona relativa al bloque de días (día1 - 3). */
    let colNumero = 1;
    let colGrado = 2;
    let colNombre = 3;

    for (let r = 1; r <= hoja.rowCount; r++) {
      const row = hoja.getRow(r);

      for (const texto of textoFila(row)) {
        const periodo = detectarMesAnio(texto);
        if (periodo) {
          mes = periodo.mes;
          anio = periodo.anio;
        }
        const titulo = tituloRol(texto);
        if (titulo) {
          actual = {
            clave: claveDe(titulo.nombre, titulo.curso),
            nombre: titulo.nombre,
            curso: titulo.curso,
            sortOrder: roles.length,
            personas: [],
          };
          roles.push(actual);
          dias = new Map();
          break;
        }
      }

      if (!actual) continue;

      const encabezado = mapaDias(row);
      if (encabezado) {
        dias = encabezado;
        const primeraColDia = Math.min(...dias.keys());
        colNumero = primeraColDia - 3;
        colGrado = primeraColDia - 2;
        colNombre = primeraColDia - 1;
        continue;
      }

      const numero = textoCelda(row.getCell(colNumero));
      const grado = textoCelda(row.getCell(colGrado));
      if (!esPersona(numero, grado)) continue;

      const marcas: MarcaDia[] = [];
      const columnas = dias.size > 0 ? [...dias.keys()] : Array.from({ length: 31 }, (_, i) => colNombre + 1 + i);
      for (const col of columnas) {
        const marca = textoCelda(row.getCell(col)).toUpperCase();
        if (!marca || marca === "0" || marca === "**") continue;
        const dia = dias.get(col) ?? col - colNombre;
        if (dia >= 1 && dia <= 31) marcas.push({ dia, marca });
      }

      const nombre = textoCelda(row.getCell(colNombre));
      if (!nombre && marcas.length === 0) continue;
      actual.personas.push({
        orden: Number(numero),
        grado,
        nombre,
        dias: marcas.sort((a, b) => a.dia - b.dia),
      });
    }
  }

  return { anio, mes, roles: deduplicarRoles(roles) };
}
