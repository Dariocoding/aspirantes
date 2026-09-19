import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { parseAspirantesCensoXlsxBuffer } from "./parse-aspirantes-censo-xlsx";

test("parsea un Excel de censo con las mismas columnas que exporta la app", async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Censo");
  ws.getCell(1, 1).value = "CENSO DE ASPIRANTES";
  ws.getCell(3, 1).value = "N°";
  ws.getCell(3, 2).value = "Nombre completo";
  ws.getCell(3, 3).value = "Cédula";
  ws.getCell(3, 4).value = "Peso (kg)";
  ws.getCell(3, 5).value = "Pelotón";
  ws.getCell(4, 1).value = 1;
  ws.getCell(4, 2).value = "JUNIOR ALBANIS CAÑIZALES ROSALES";
  ws.getCell(4, 3).value = "21425976";
  ws.getCell(4, 4).value = 100;
  ws.getCell(4, 5).value = "Pelotón 1";

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const parsed = await parseAspirantesCensoXlsxBuffer(buffer);
  assert.deepEqual(parsed.columnIds, ["nombreCompleto", "cedula", "peso", "peloton"]);
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.cedula, "21425976");
  assert.equal(parsed.rows[0]?.values.peso, "100");
  assert.equal(parsed.rows[0]?.values.peloton, "Pelotón 1");
});
