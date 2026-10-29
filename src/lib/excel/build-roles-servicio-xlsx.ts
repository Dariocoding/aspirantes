import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  diasDelMes,
  esColumnaAmarilla,
  letraSemana,
  type MarcaDia,
} from "@src/lib/roles-servicio/marcas";
import { contarDsFs } from "@src/lib/roles-servicio/generar-rotacion";
import { foldBusqueda } from "@src/lib/text/fold";

export type PersonaExportRol = {
  orden: number;
  grado: string;
  nombre: string;
  dias: MarcaDia[];
};

export type PlanExportRol = {
  clave: string;
  nombre: string;
  curso: string;
  asignaciones: PersonaExportRol[];
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
] as const;

const FILL_AMARILLO: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};

const PLANTILLA_RELATIVA = ["assets", "roles-servicio", "plantilla-roles.xlsx"] as const;

type BloquePlantilla = {
  titleRow: number;
  weekdayRow: number;
  dayRow: number;
  personStart: number;
  personEnd: number;
  colNumero: number;
  colGrado: number;
  colNombre: number;
  dias: Map<number, number>;
  colDs: number | null;
  colFs: number | null;
  colTotal: number | null;
  tituloNombre: string;
};

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
    if ("text" in value && typeof value.text === "string") {
      return value.text.replace(/\s+/g, " ").trim();
    }
    if ("result" in value && value.result != null && typeof value.result !== "object") {
      return String(value.result).replace(/\s+/g, " ").trim();
    }
  }
  return "";
}

function tituloRol(texto: string): { nombre: string; curso: string } | null {
  const normalizado = texto.replace(/\s+/g, " ").trim();
  if (!/^ROL DE SERVICIO\b/i.test(normalizado)) return null;

  const cursoMatch = normalizado.match(/CEFOA\s*N[°ºªo.]?\s*(\d+)/i);
  const curso = cursoMatch?.[1] ? `CEFOA ${cursoMatch[1]}` : "CEFOA 46";

  const nombre = normalizado
    .replace(/^ROL DE SERVICIO\s+(?:DE(?:L)?\s+)?/i, "")
    .replace(/\s*CEFOA\s*N[°ºªo.]?\s*\d+/gi, " ")
    .replace(
      /\s*(?:CORRESPONDIENTE\s+AL\s+)?(?:DEL\s+)?MES\s+DE\s+(?:ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+\d{4}\s*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!nombre) return null;
  return { nombre, curso };
}

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

function filaVaciaPersona(
  row: ExcelJS.Row,
  colNumero: number,
  colGrado: number,
  colNombre: number,
): boolean {
  return (
    !textoCelda(row.getCell(colNumero)) &&
    !textoCelda(row.getCell(colGrado)) &&
    !textoCelda(row.getCell(colNombre))
  );
}

function esInicioFirma(
  row: ExcelJS.Row,
  colNumero: number,
  colGrado: number,
  colNombre: number,
): boolean {
  const numero = textoCelda(row.getCell(colNumero));
  const grado = textoCelda(row.getCell(colGrado));
  const nombre = textoCelda(row.getCell(colNombre));
  if (esPersona(numero, grado)) return false;
  const blob = `${grado} ${nombre}`;
  if (
    /OFICIAL DE PERSONAL|COMANDANTE DEL CUERPO|SUB-?DIRECTOR|DIRECTOR DEL CEFOA|PRIMER TENIENTE|TENIENTE CORONEL|\bMAYOR\b|\bCORONEL\b|\bCAPIT[AÁ]N\b/i.test(
      blob,
    )
  ) {
    return true;
  }
  if (
    !numero &&
    nombre.length >= 10 &&
    !/^ROL DE SERVICIO/i.test(nombre) &&
    !/NOMBRES Y APELLIDOS|GRADO/i.test(nombre)
  ) {
    return true;
  }
  return false;
}

function reemplazarMesTitulo(texto: string, mes: number, anio: number): string {
  const nombreMes = MESES[mes - 1] ?? String(mes);
  return texto.replace(
    /\b((?:CORRESPONDIENTE\s+AL\s+)?(?:DEL\s+)?MES\s+DE\s+)(?:ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+\d{4}\b/gi,
    `$1${nombreMes} ${anio}`,
  );
}

function foldClave(texto: string): string {
  return foldBusqueda(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Puntaje de coincidencia título de hoja ↔ nombre del plan en BD. */
export function scoreMatchRol(tituloNombre: string, planNombre: string): number {
  const a = foldClave(tituloNombre);
  const b = foldClave(planNombre);
  if (!a || !b) return 0;
  if (a === b) return 1000;
  if (a.includes(b) || b.includes(a)) return 500 + Math.min(a.length, b.length);

  const ta = new Set(a.split(" ").filter((t) => t.length > 1));
  const tb = new Set(b.split(" ").filter((t) => t.length > 1));
  let common = 0;
  for (const t of ta) if (tb.has(t)) common += 1;
  if (common === 0) return 0;
  return common * 80 + (common / Math.max(ta.size, tb.size)) * 40;
}

function colsResumen(
  weekdayRow: ExcelJS.Row,
  dias: Map<number, number>,
): { colDs: number | null; colFs: number | null; colTotal: number | null } {
  const ultimaDia = Math.max(...dias.keys());
  let colDs: number | null = null;
  let colFs: number | null = null;
  let colTotal: number | null = null;
  for (let col = ultimaDia + 1; col <= ultimaDia + 6; col++) {
    const label = textoCelda(weekdayRow.getCell(col)).toUpperCase();
    if (label === "D/S" || label === "DS") colDs = col;
    else if (label === "F/S" || label === "FS") colFs = col;
    else if (label === "TOTAL") colTotal = col;
  }
  return { colDs, colFs, colTotal };
}

function detectarBloques(hoja: ExcelJS.Worksheet): BloquePlantilla[] {
  const bloques: BloquePlantilla[] = [];
  let pendiente: { titleRow: number; tituloNombre: string } | null = null;

  for (let r = 1; r <= hoja.rowCount; r++) {
    const row = hoja.getRow(r);

    if (!pendiente) {
      for (let c = 1; c <= 40; c++) {
        const titulo = tituloRol(textoCelda(row.getCell(c)));
        if (titulo) {
          pendiente = { titleRow: r, tituloNombre: titulo.nombre };
          break;
        }
      }
      continue;
    }

    const dias = mapaDias(row);
    if (!dias) continue;

    const dayRow = r;
    const weekdayRow = r - 1;
    const primeraColDia = Math.min(...dias.keys());
    const colNumero = primeraColDia - 3;
    const colGrado = primeraColDia - 2;
    const colNombre = primeraColDia - 1;
    const resumen = colsResumen(hoja.getRow(weekdayRow), dias);

    let personStart = dayRow + 1;
    let personEnd = dayRow;
    for (let pr = personStart; pr <= hoja.rowCount; pr++) {
      const prow = hoja.getRow(pr);
      let hayTitulo = false;
      for (let c = 1; c <= 40; c++) {
        if (tituloRol(textoCelda(prow.getCell(c)))) {
          hayTitulo = true;
          break;
        }
      }
      if (hayTitulo) break;
      if (esInicioFirma(prow, colNumero, colGrado, colNombre)) break;

      if (esPersona(textoCelda(prow.getCell(colNumero)), textoCelda(prow.getCell(colGrado)))) {
        personEnd = pr;
        continue;
      }
      if (filaVaciaPersona(prow, colNumero, colGrado, colNombre)) {
        personEnd = pr;
        continue;
      }
      break;
    }

    if (personEnd < personStart) personEnd = personStart - 1;

    bloques.push({
      titleRow: pendiente.titleRow,
      weekdayRow,
      dayRow,
      personStart,
      personEnd,
      colNumero,
      colGrado,
      colNombre,
      dias,
      colDs: resumen.colDs,
      colFs: resumen.colFs,
      colTotal: resumen.colTotal,
      tituloNombre: pendiente.tituloNombre,
    });
    pendiente = null;
    r = Math.max(r, personEnd);
  }

  return bloques;
}

function aplicarFillDia(cell: ExcelJS.Cell, amarillo: boolean) {
  if (amarillo) {
    cell.fill = FILL_AMARILLO;
    return;
  }
  const actual = cell.fill;
  if (actual && actual.type === "pattern" && actual.pattern === "solid") {
    cell.fill = { type: "pattern", pattern: "none" };
  }
}

function actualizarCalendario(
  hoja: ExcelJS.Worksheet,
  bloque: BloquePlantilla,
  anio: number,
  mes: number,
) {
  const totalDias = diasDelMes(anio, mes);
  const weekdayRow = hoja.getRow(bloque.weekdayRow);
  const dayRow = hoja.getRow(bloque.dayRow);

  for (const [col, dia] of bloque.dias) {
    const dayCell = dayRow.getCell(col);
    const weekCell = weekdayRow.getCell(col);
    if (dia > totalDias) {
      dayCell.value = null;
      weekCell.value = null;
      aplicarFillDia(dayCell, false);
      aplicarFillDia(weekCell, false);
      continue;
    }
    dayCell.value = dia;
    weekCell.value = letraSemana(anio, mes, dia);
    const amarillo = esColumnaAmarilla(anio, mes, dia);
    aplicarFillDia(dayCell, amarillo);
    aplicarFillDia(weekCell, amarillo);
  }
}

function actualizarTitulo(hoja: ExcelJS.Worksheet, bloque: BloquePlantilla, anio: number, mes: number) {
  const row = hoja.getRow(bloque.titleRow);
  for (let c = 1; c <= 45; c++) {
    const cell = row.getCell(c);
    const texto = textoCelda(cell);
    if (!texto || !/MES\s+DE\s+/i.test(texto)) continue;
    cell.value = reemplazarMesTitulo(texto, mes, anio);
  }
}

function estiloDesde(origen: ExcelJS.Cell, destino: ExcelJS.Cell) {
  if (origen.style) {
    destino.style = { ...origen.style };
  }
  if (origen.numFmt) destino.numFmt = origen.numFmt;
  if (origen.alignment) destino.alignment = { ...origen.alignment };
  if (origen.border) destino.border = { ...origen.border };
  if (origen.fill) destino.fill = { ...origen.fill };
  if (origen.font) destino.font = { ...origen.font };
}

function asegurarCupos(
  hoja: ExcelJS.Worksheet,
  bloque: BloquePlantilla,
  necesarios: number,
): BloquePlantilla {
  const actuales = Math.max(0, bloque.personEnd - bloque.personStart + 1);
  if (necesarios <= actuales) return bloque;

  const faltan = necesarios - actuales;
  const filaModelo = bloque.personEnd >= bloque.personStart ? bloque.personEnd : bloque.dayRow;
  const modelo = hoja.getRow(filaModelo);
  const insertAt = bloque.personEnd + 1;
  hoja.spliceRows(insertAt, 0, ...Array.from({ length: faltan }, () => []));

  const maxCol = Math.max(...bloque.dias.keys(), bloque.colNombre, bloque.colTotal ?? 0, 40);
  for (let i = 0; i < faltan; i++) {
    const dest = hoja.getRow(insertAt + i);
    dest.height = modelo.height;
    for (let c = 1; c <= maxCol; c++) {
      estiloDesde(modelo.getCell(c), dest.getCell(c));
      dest.getCell(c).value = null;
    }
  }

  return { ...bloque, personEnd: bloque.personEnd + faltan };
}

function limpiarFilaPersona(hoja: ExcelJS.Worksheet, bloque: BloquePlantilla, rowIndex: number) {
  const row = hoja.getRow(rowIndex);
  row.getCell(bloque.colNumero).value = null;
  row.getCell(bloque.colGrado).value = null;
  row.getCell(bloque.colNombre).value = null;
  for (const col of bloque.dias.keys()) {
    const cell = row.getCell(col);
    cell.value = null;
  }
  if (bloque.colDs) row.getCell(bloque.colDs).value = null;
  if (bloque.colFs) row.getCell(bloque.colFs).value = null;
  if (bloque.colTotal) row.getCell(bloque.colTotal).value = null;
}

function escribirPersonas(
  hoja: ExcelJS.Worksheet,
  bloque: BloquePlantilla,
  personas: PersonaExportRol[],
  anio: number,
  mes: number,
) {
  const cupos = Math.max(0, bloque.personEnd - bloque.personStart + 1);
  for (let i = 0; i < cupos; i++) {
    limpiarFilaPersona(hoja, bloque, bloque.personStart + i);
  }

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i]!;
    const row = hoja.getRow(bloque.personStart + i);
    row.getCell(bloque.colNumero).value = persona.orden || i + 1;
    row.getCell(bloque.colGrado).value = persona.grado || "ASP/OFIC";
    row.getCell(bloque.colNombre).value = persona.nombre.toUpperCase();

    const porDia = new Map(persona.dias.map((d) => [d.dia, d.marca]));
    for (const [col, dia] of bloque.dias) {
      const marca = porDia.get(dia);
      const cell = row.getCell(col);
      if (!marca || dia > diasDelMes(anio, mes)) {
        cell.value = null;
        continue;
      }
      cell.value = marca;
      if (esColumnaAmarilla(anio, mes, dia)) cell.fill = FILL_AMARILLO;
    }

    const conteo = contarDsFs(persona.dias, anio, mes, esColumnaAmarilla);
    if (bloque.colDs) row.getCell(bloque.colDs).value = conteo.ds || null;
    if (bloque.colFs) row.getCell(bloque.colFs).value = conteo.fs || null;
    if (bloque.colTotal) row.getCell(bloque.colTotal).value = conteo.total || null;
  }
}

function emparejarPlanes(
  bloques: BloquePlantilla[],
  planes: PlanExportRol[],
): Array<{ bloque: BloquePlantilla; plan: PlanExportRol | null }> {
  const disponibles = [...planes];
  return bloques.map((bloque) => {
    let mejor: PlanExportRol | null = null;
    let mejorScore = 0;
    let mejorIdx = -1;
    for (let i = 0; i < disponibles.length; i++) {
      const plan = disponibles[i]!;
      const score = scoreMatchRol(bloque.tituloNombre, plan.nombre);
      if (score > mejorScore) {
        mejorScore = score;
        mejor = plan;
        mejorIdx = i;
      }
    }
    if (!mejor || mejorScore < 80) return { bloque, plan: null };
    disponibles.splice(mejorIdx, 1);
    return { bloque, plan: mejor };
  });
}

export function rutaPlantillaRolesServicio(cwd = process.cwd()): string {
  return path.join(cwd, ...PLANTILLA_RELATIVA);
}

/**
 * Rellena la plantilla oficial: conserva membrete, logos y firmas;
 * solo cambia mes/año, letras de día, personas y marcas.
 */
export async function buildRolesServicioXlsxBuffer(params: {
  anio: number;
  mes: number;
  planes: PlanExportRol[];
  plantillaPath?: string;
}): Promise<Buffer> {
  const plantillaPath = params.plantillaPath ?? rutaPlantillaRolesServicio();
  if (!fs.existsSync(plantillaPath)) {
    throw new Error(`No está la plantilla de roles en ${plantillaPath}`);
  }

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(plantillaPath);

  for (const hoja of libro.worksheets) {
    const bloques = detectarBloques(hoja);
    if (bloques.length === 0) continue;

    const emparejados = emparejarPlanes(bloques, params.planes);

    // De abajo hacia arriba para que insertar filas no desplace bloques previos.
    for (const item of [...emparejados].reverse()) {
      let bloque = item.bloque;
      actualizarTitulo(hoja, bloque, params.anio, params.mes);
      actualizarCalendario(hoja, bloque, params.anio, params.mes);

      if (!item.plan) {
        const cupos = Math.max(0, bloque.personEnd - bloque.personStart + 1);
        for (let i = 0; i < cupos; i++) limpiarFilaPersona(hoja, bloque, bloque.personStart + i);
        continue;
      }

      const personas = [...item.plan.asignaciones].sort((a, b) => a.orden - b.orden);
      bloque = asegurarCupos(hoja, bloque, personas.length);
      escribirPersonas(hoja, bloque, personas, params.anio, params.mes);
    }
  }

  const out = await libro.xlsx.writeBuffer();
  return Buffer.from(out);
}
