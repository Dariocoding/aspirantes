import "server-only";
import ExcelJS from "exceljs";
import type { MembreteSpec } from "@src/lib/membrete";
import { readMembreteLogoPngBuffer } from "@src/lib/pdf/institution-logo";

function logoBuffer(kind: MembreteSpec["logoIzq"]): Buffer | null {
  return readMembreteLogoPngBuffer(kind);
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

  const rowsUsed = Math.max(lineas.length, leftBuf || rightBuf ? 5 : lineas.length);
  const padTop = Math.max(0, Math.floor((rowsUsed - lineas.length) / 2));
  const padded: string[] = Array.from({ length: rowsUsed }, () => "");
  lineas.forEach((line, i) => {
    padded[padTop + i] = line;
  });

  const firstTextIndex = padded.findIndex((t) => t.length > 0);
  const textStart = lastCol >= 4 && leftBuf ? 2 : 1;
  const textEnd = lastCol >= 4 && rightBuf ? lastCol - 1 : lastCol;

  for (let i = 0; i < rowsUsed; i++) {
    const rowNum = i + 1;
    ws.mergeCells(rowNum, textStart, rowNum, textEnd);
    const cell = ws.getCell(rowNum, textStart);
    cell.value = padded[i] || "";
    cell.font = {
      name: "Calibri",
      size: i === firstTextIndex ? 11 : 9,
      bold: i === firstTextIndex,
      color: { argb: "FF111827" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    ws.getRow(rowNum).height = 16;
  }

  if (leftBuf) {
    const id = wb.addImage({ buffer: leftBuf as unknown as ExcelJS.Buffer, extension: "png" });
    ws.addImage(id, {
      tl: { col: 0.12, row: 0.15 },
      ext: { width: 58, height: 58 },
      editAs: "oneCell",
    });
  }
  if (rightBuf) {
    const id = wb.addImage({ buffer: rightBuf as unknown as ExcelJS.Buffer, extension: "png" });
    ws.addImage(id, {
      tl: { col: Math.max(0, lastCol - 1.05), row: 0.15 },
      ext: { width: 58, height: 58 },
      editAs: "oneCell",
    });
  }

  return rowsUsed;
}
