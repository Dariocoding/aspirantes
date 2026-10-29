import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import ExcelJS from "exceljs";
import {
  buildRolesServicioXlsxBuffer,
  rutaPlantillaRolesServicio,
  scoreMatchRol,
} from "@src/lib/excel/build-roles-servicio-xlsx";

function textoCelda(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object" && "richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((parte) => parte.text).join("");
  }
  return "";
}

test("scoreMatchRol prioriza el nombre completo del rol", () => {
  assert.ok(
    scoreMatchRol("ENFERMERIA", "ENFERMERIA") >
      scoreMatchRol("ENFERMERIA", "MEDICINA"),
  );
  assert.ok(
    scoreMatchRol("GUARDIA BAÑO 1ER PELOTÓN MASCULINO", "GUARDIA BAÑO 1ER PELOTÓN MASCULINO") >=
      500,
  );
});

test("buildRolesServicioXlsxBuffer genera un xlsx desde la plantilla", async () => {
  const plantilla = rutaPlantillaRolesServicio();
  assert.ok(fs.existsSync(plantilla), `falta plantilla en ${plantilla}`);

  const buffer = await buildRolesServicioXlsxBuffer({
    anio: 2026,
    mes: 11,
    plantillaPath: plantilla,
    planes: [
      {
        clave: "enfermeria",
        nombre: "ENFERMERIA",
        curso: "CEFOA 46",
        asignaciones: [
          {
            orden: 1,
            grado: "ASP/OFIC",
            nombre: "PERSONA DE PRUEBA",
            dias: [
              { dia: 2, marca: "X" },
              { dia: 15, marca: "X" },
            ],
          },
        ],
      },
      {
        clave: "medicina",
        nombre: "MEDICINA",
        curso: "CEFOA 46",
        asignaciones: [
          {
            orden: 1,
            grado: "ASP/OFIC",
            nombre: "MEDICO DE PRUEBA",
            dias: [{ dia: 3, marca: "X" }],
          },
        ],
      },
    ],
  });

  assert.ok(buffer.length > 10_000);
  assert.equal(buffer[0], 0x50); // PKzip
  assert.equal(buffer[1], 0x4b);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("ENF. Y MED.");
  assert.ok(ws);
  const titulo = textoCelda(ws.getRow(9).getCell(3));
  assert.match(titulo, /NOVIEMBRE 2026/i);
  assert.match(textoCelda(ws.getRow(13).getCell(5)), /PERSONA DE PRUEBA/i);
  assert.equal(textoCelda(ws.getRow(13).getCell(7)), "X"); // día 2
  assert.match(textoCelda(ws.getRow(34).getCell(3)), /OSWALDO MORILLO/i); // firma intacta
  assert.ok(ws.getImages().length >= 2); // logos del membrete
});
