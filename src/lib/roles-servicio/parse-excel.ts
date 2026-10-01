import ExcelJS from "exceljs";
import { foldBusqueda } from "@src/lib/text/fold";
import type { MarcaDia } from "@src/lib/roles-servicio/marcas";

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

function tituloRol(texto: string): { nombre: string; curso: string } | null {
  if (!texto.startsWith("ROL DE SERVICIO")) return null;
  const cursoMatch = texto.match(/CEFOA\s*N[°ºo.]?\s*(\d+)/i);
  const curso = cursoMatch?.[1] ? `CEFOA ${cursoMatch[1]}` : "CEFOA";
  const nombre = texto
    .replace(/^ROL DE SERVICIO DE\s+/i, "")
    .replace(/\s*CEFOA\s*N[°ºo.]?\s*\d+\s*$/i, "")
    .trim();
  if (!nombre) return null;
  return { nombre, curso };
}

function mapaDias(row: ExcelJS.Row): Map<number, number> | null {
  if (textoCelda(row.getCell(4)) !== "1" || textoCelda(row.getCell(5)) !== "2") return null;
  const mapa = new Map<number, number>();
  for (let col = 4; col <= 40; col++) {
    const texto = textoCelda(row.getCell(col));
    if (!/^\d+$/.test(texto)) break;
    mapa.set(col, Number(texto));
  }
  return mapa.size > 0 ? mapa : null;
}

function esPersona(numero: string, grado: string): boolean {
  return /^\d+$/.test(numero) && grado.length > 0 && !/grado|nombres|n[º°]/i.test(grado);
}

export async function parsearRolesExcel(ruta: string): Promise<LibroRolesParseado> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(ruta);

  let anio = 2026;
  let mes = 9;
  const roles: RolParseado[] = [];

  for (const hoja of libro.worksheets) {
    let actual: RolParseado | null = null;
    let dias = new Map<number, number>();

    for (let r = 1; r <= hoja.rowCount; r++) {
      const row = hoja.getRow(r);
      const primera = textoCelda(row.getCell(1));
      const mesMatch = primera.match(
        new RegExp(`(${MESES.join("|")})[,\\s]+(\\d{4})`, "i"),
      );
      if (!mesMatch) {
        for (let col = 1; col <= 36; col++) {
          const candidato = textoCelda(row.getCell(col));
          const hallado = candidato.match(new RegExp(`(${MESES.join("|")})[,\\s]+(\\d{4})`, "i"));
          if (hallado?.[1] && hallado[2]) {
            mes = MESES.indexOf(hallado[1].toUpperCase()) + 1;
            anio = Number(hallado[2]);
            break;
          }
        }
      } else if (mesMatch[1] && mesMatch[2]) {
        mes = MESES.indexOf(mesMatch[1].toUpperCase()) + 1;
        anio = Number(mesMatch[2]);
      }

      const titulo = tituloRol(primera);
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
        continue;
      }
      if (!actual) continue;

      const encabezado = mapaDias(row);
      if (encabezado) {
        dias = encabezado;
        continue;
      }

      const grado = textoCelda(row.getCell(2));
      if (!esPersona(primera, grado)) continue;

      const marcas: MarcaDia[] = [];
      const columnas = dias.size > 0 ? [...dias.keys()] : Array.from({ length: 30 }, (_, i) => i + 4);
      for (const col of columnas) {
        const marca = textoCelda(row.getCell(col)).toUpperCase();
        if (!marca || marca === "0") continue;
        const dia = dias.get(col) ?? col - 3;
        if (dia >= 1 && dia <= 31) marcas.push({ dia, marca });
      }

      const nombre = textoCelda(row.getCell(3));
      if (!nombre && marcas.length === 0) continue;
      actual.personas.push({
        orden: Number(primera),
        grado,
        nombre,
        dias: marcas.sort((a, b) => a.dia - b.dia),
      });
    }
  }

  return { anio, mes, roles };
}
