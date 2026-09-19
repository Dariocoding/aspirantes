import "server-only";
import ExcelJS from "exceljs";
import type { MembreteSpec } from "@src/lib/membrete";
import { readMembreteLogoPngBuffer } from "@src/lib/pdf/institution-logo";

const LINE_HEIGHT = 20;
const LOGO_ROWS = 5;
const LOGO_PX = 64;
const FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 12, color: { argb: "FF111827" } };

function logoBuffer(kind: MembreteSpec["logoIzq"]): Buffer | null {
  return readMembreteLogoPngBuffer(kind);
}

function columnWidth(ws: ExcelJS.Worksheet, col: number): number {
  const w = ws.getColumn(col).width;
  return typeof w === "number" && w > 0 ? w : 10;
}

function ensureMinWidth(ws: ExcelJS.Worksheet, col: number, min: number) {
  ws.getColumn(col).width = Math.max(columnWidth(ws, col), min);
}

function middleWidth(ws: ExcelJS.Worksheet, start: number, end: number): number {
  let sum = 0;
  for (let c = start; c <= end; c++) sum += columnWidth(ws, c);
  return sum;
}

function addLogo(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, buf: Buffer, tlCol: number) {
  const id = wb.addImage({ buffer: buf as unknown as ExcelJS.Buffer, extension: "png" });
  const position: ExcelJS.ImagePosition = {
    tl: { col: tlCol, row: 0.15 },
    ext: { width: LOGO_PX, height: LOGO_PX },
  };
  ws.addImage(id, position);
}

/**
 * Escribe el bloque de membrete institucional al inicio de la hoja.
 * `spanCols` es el ancho visual (puede ser mayor que las columnas de datos).
 * Devuelve cuántas filas ocupó (0 si no hay membrete).
 */
export function applyExcelMembreteHeader(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  spanCols: number,
  membrete: MembreteSpec | null | undefined,
): number {
  if (!membrete) return 0;
  const lineas = membrete.lineas.map((l) => l.trim()).filter(Boolean).slice(0, 8);
  const leftBuf = logoBuffer(membrete.logoIzq);
  const rightBuf = logoBuffer(membrete.logoDer);
  if (!lineas.length && !leftBuf && !rightBuf) return 0;

  if (leftBuf) ensureMinWidth(ws, 1, 11);
  if (rightBuf && spanCols > 1) ensureMinWidth(ws, spanCols, 12);

  const canFlank = spanCols >= 5;
  const textStart = canFlank && leftBuf ? 2 : 1;
  const textEnd = canFlank && rightBuf ? Math.max(textStart, spanCols - 1) : spanCols;
  const textColsWidth = middleWidth(ws, textStart, textEnd);
  const hasLogos = Boolean(leftBuf || rightBuf);
  const textOffset = !canFlank && hasLogos ? LOGO_ROWS : 0;
  const blockRows = Math.max(lineas.length, canFlank && hasLogos ? LOGO_ROWS : lineas.length);
  const rowsUsed = textOffset + blockRows;
  const padTop = canFlank ? Math.max(0, Math.floor((blockRows - lineas.length) / 2)) : 0;
  const padded: string[] = Array.from({ length: rowsUsed }, () => "");
  lineas.forEach((line, i) => {
    padded[textOffset + padTop + i] = line;
  });

  const firstTextIndex = padded.findIndex((t) => t.length > 0);
  const charsPerLine = Math.max(18, Math.floor(textColsWidth * 1.05));

  for (let i = 0; i < rowsUsed; i++) {
    const rowNum = i + 1;
    const mergeStart = i < textOffset ? 1 : textStart;
    const mergeEnd = i < textOffset ? spanCols : textEnd;
    if (mergeStart !== mergeEnd) {
      ws.mergeCells(rowNum, mergeStart, rowNum, mergeEnd);
    }
    const cell = ws.getCell(rowNum, mergeStart);
    const text = padded[i] || "";
    cell.value = text;
    cell.font = { ...FONT, bold: i === firstTextIndex };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    const wraps = text ? Math.ceil(text.length / charsPerLine) : 1;
    ws.getRow(rowNum).height = i < textOffset ? LINE_HEIGHT : Math.max(LINE_HEIGHT, wraps * 16);
  }

  if (leftBuf) {
    addLogo(wb, ws, leftBuf, 0.15);
  }
  if (rightBuf && spanCols > 1) {
    addLogo(wb, ws, rightBuf, spanCols - 0.95);
  }

  return rowsUsed;
}
