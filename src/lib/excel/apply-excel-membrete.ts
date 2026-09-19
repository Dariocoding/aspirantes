import "server-only";
import ExcelJS from "exceljs";
import type { MembreteSpec } from "@src/lib/membrete";
import { readMembreteLogoPngBuffer } from "@src/lib/pdf/institution-logo";

const LOGO_COL_MIN_WIDTH = 13;
const LINE_HEIGHT = 18;
const LOGO_ROWS = 5;

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
    tl: { col: tlCol, row: 0.2 },
    ext: { width: 72, height: 72 },
  };
  ws.addImage(id, position);
}

/**
 * Escribe el bloque de membrete institucional al inicio de la hoja.
 * Devuelve cuántas filas ocupó (0 si no hay membrete).
 */
export function applyExcelMembreteHeader(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  lastCol: number,
  membrete: MembreteSpec | null | undefined,
): number {
  if (!membrete) return 0;
  const lineas = membrete.lineas.map((l) => l.trim()).filter(Boolean).slice(0, 8);
  const leftBuf = logoBuffer(membrete.logoIzq);
  const rightBuf = logoBuffer(membrete.logoDer);
  if (!lineas.length && !leftBuf && !rightBuf) return 0;

  if (leftBuf) ensureMinWidth(ws, 1, LOGO_COL_MIN_WIDTH);
  if (rightBuf && lastCol > 1) ensureMinWidth(ws, lastCol, LOGO_COL_MIN_WIDTH);

  const canFlank = lastCol >= 3;
  const textStart = canFlank && leftBuf ? 2 : 1;
  const textEnd = canFlank && rightBuf ? Math.max(textStart, lastCol - 1) : lastCol;
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
  const charsPerLine = Math.max(12, Math.floor(textColsWidth * 1.05));

  for (let i = 0; i < rowsUsed; i++) {
    const rowNum = i + 1;
    const mergeStart = i < textOffset ? 1 : textStart;
    const mergeEnd = i < textOffset ? lastCol : textEnd;
    if (mergeStart !== mergeEnd) {
      ws.mergeCells(rowNum, mergeStart, rowNum, mergeEnd);
    }
    const cell = ws.getCell(rowNum, mergeStart);
    const text = padded[i] || "";
    cell.value = text;
    cell.font = {
      name: "Calibri",
      size: i === firstTextIndex ? 12 : 10,
      bold: i === firstTextIndex || i === firstTextIndex + 1,
      color: { argb: "FF111827" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    const wraps = text ? Math.ceil(text.length / charsPerLine) : 1;
    ws.getRow(rowNum).height = i < textOffset ? LINE_HEIGHT : Math.max(LINE_HEIGHT, wraps * 15);
  }

  if (leftBuf) {
    addLogo(wb, ws, leftBuf, 0.18);
  }
  if (rightBuf && lastCol > 1) {
    addLogo(wb, ws, rightBuf, lastCol - 0.92);
  }

  return rowsUsed;
}
