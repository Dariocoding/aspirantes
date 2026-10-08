import "server-only";
import ExcelJS from "exceljs";
import type { MembreteSpec } from "@src/lib/membrete";
import { readMembreteLogoPngBuffer } from "@src/lib/pdf/institution-logo";

const LINE_HEIGHT = 18;
const LOGO_PX = 68;
const LOGO_PT = 50;
const LOGO_COL_WIDTH = 14;
const FONT: Partial<ExcelJS.Font> = { name: "Arial", size: 11, color: { argb: "FF111827" } };

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

function columnPx(width: number): number {
  return Math.round(width * 7 + 5);
}

function logoColInset(ws: ExcelJS.Worksheet, col: number, align: "left" | "right" | "center"): number {
  const px = columnPx(columnWidth(ws, col));
  const pad =
    align === "center" ? Math.max(4, (px - LOGO_PX) / 2) : align === "left" ? 6 : Math.max(6, px - LOGO_PX - 6);
  const fraction = px > 0 ? Math.min(0.82, Math.max(0.04, pad / px)) : 0.12;
  return col - 1 + fraction;
}

function addLogo(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, buf: Buffer, tlCol: number, tlRow: number) {
  const id = wb.addImage({ buffer: buf as unknown as ExcelJS.Buffer, extension: "png" });
  const position: ExcelJS.ImagePosition = {
    tl: { col: tlCol, row: tlRow },
    ext: { width: LOGO_PX, height: LOGO_PX },
  };
  ws.addImage(id, position);
}

function rowOffsetAt(heights: number[], topPt: number): number {
  let acc = 0;
  for (let i = 0; i < heights.length; i++) {
    const height = heights[i] ?? LINE_HEIGHT;
    if (acc + height >= topPt || i === heights.length - 1) {
      const into = Math.min(height, Math.max(0, topPt - acc));
      return i + (height > 0 ? into / height : 0);
    }
    acc += height;
  }
  return 0;
}

/**
 * Escribe el bloque de membrete institucional al inicio de la hoja.
 * `spanCols` es la cantidad de columnas de datos: el membrete ocupa exactamente ese ancho.
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

  const hasLogos = Boolean(leftBuf || rightBuf);
  const gutterLeft = Boolean(leftBuf) && spanCols >= 3 && columnWidth(ws, 1) <= 18;
  const gutterRight = Boolean(rightBuf) && spanCols >= 3 && columnWidth(ws, spanCols) <= 22;
  if (gutterLeft) ensureMinWidth(ws, 1, LOGO_COL_WIDTH);
  if (gutterRight) ensureMinWidth(ws, spanCols, LOGO_COL_WIDTH);
  if (leftBuf && !gutterLeft) ensureMinWidth(ws, 1, 12);
  if (rightBuf && spanCols > 1 && !gutterRight) ensureMinWidth(ws, spanCols, 12);

  const textStart = gutterLeft ? 2 : 1;
  const textEnd = gutterRight ? Math.max(textStart, spanCols - 1) : spanCols;
  const textColsWidth = middleWidth(ws, textStart, textEnd);
  const charsPerLine = Math.max(22, Math.floor(textColsWidth * 1.05));
  const rowsUsed = Math.max(lineas.length, hasLogos ? 1 : 0);
  if (!rowsUsed) return 0;

  const heights = Array.from({ length: rowsUsed }, (_, i) => {
    const text = lineas[i] ?? "";
    const wraps = text ? Math.max(1, Math.ceil(text.length / charsPerLine)) : 1;
    return text ? Math.max(LINE_HEIGHT, wraps * 15) : LINE_HEIGHT;
  });
  if (hasLogos) {
    const total = heights.reduce((sum, height) => sum + height, 0);
    const missing = LOGO_PT + 6 - total;
    if (missing > 0) {
      const extra = missing / heights.length;
      for (let i = 0; i < heights.length; i++) heights[i] = (heights[i] ?? LINE_HEIGHT) + extra;
    }
  }

  for (let i = 0; i < rowsUsed; i++) {
    const rowNum = i + 1;
    if (textStart !== textEnd) ws.mergeCells(rowNum, textStart, rowNum, textEnd);
    const cell = ws.getCell(rowNum, textStart);
    const text = lineas[i] ?? "";
    cell.value = text;
    cell.font = { ...FONT, bold: i === 0 && text.length > 0, size: i === 0 ? 12 : 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    ws.getRow(rowNum).height = heights[i] ?? LINE_HEIGHT;
  }

  const totalPt = heights.reduce((sum, height) => sum + height, 0);
  const logoRow = rowOffsetAt(heights, Math.max(0, (totalPt - LOGO_PT) / 2));
  if (leftBuf) addLogo(wb, ws, leftBuf, logoColInset(ws, 1, gutterLeft ? "center" : "left"), logoRow);
  if (rightBuf && spanCols > 1) {
    addLogo(wb, ws, rightBuf, logoColInset(ws, spanCols, gutterRight ? "center" : "right"), logoRow);
  }

  return rowsUsed;
}
