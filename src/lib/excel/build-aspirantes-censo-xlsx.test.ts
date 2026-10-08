import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { parseAspirantesCensoXlsxBuffer } from "./parse-aspirantes-censo-xlsx";
import { buildAspirantesCensoXlsxBuffer, type AspiranteCensoExportRow } from "./build-aspirantes-censo-xlsx";
import { PLANTILLA_MEMBRETE_CEFOA45 } from "@src/lib/membrete";

function sampleRow(): AspiranteCensoExportRow {
  return {
    nombres: "JUNIOR ALBANIS",
    apellidos: "CAÑIZALES ROSALES",
    unidadPostulante: "Unidad",
    condicionMilitar: null,
    jerarquia: "ASPIRANTE_OFICIAL",
    tituloUniversidad: null,
    tipoEstudio: null,
    cedula: "21425976",
    carnetPatriaCodigo: null,
    carnetPatriaSerial: null,
    cuentaNominaBanfanb: null,
    sexo: "MASCULINO",
    edad: 30,
    fechaNacimiento: new Date("1995-01-15T12:00:00Z"),
    lugarNacimiento: "Caracas",
    calificacionAdmision: "APTO",
    pelotonLabel: "Pelotón 1",
    telefono: null,
    correo: null,
    direccion: null,
    estadoCivil: null,
    religion: null,
    deporte: null,
    hijosCantidad: 0,
    nombreUniversidad: null,
    paisUniversidad: null,
    contactoNombre: null,
    contactoParentesco: null,
    contactoTelefono: null,
    estaturaCm: null,
    pesoKg: 100,
    tipoSangre: null,
    factorRh: null,
    tensionArterial: null,
    alergias: null,
    condicionesMedicas: null,
    discapacidad: null,
    observaciones: null,
    tallaGorra: null,
    tallaCamisa: null,
    tallaPantalon: null,
    tallaCalzado: null,
    tallaUniformePatriota: null,
    fichaEvaluacion: null,
  };
}

test("el import encuentra Cédula debajo de un membrete institucional", async () => {
  const buffer = await buildAspirantesCensoXlsxBuffer({
    convocatoriaNombre: "CEFOA 46",
    convocatoriaCodigo: "CEFOA-46",
    anio: 2026,
    rows: [sampleRow()],
    columnIds: ["numero", "nombreCompleto", "cedula"],
    generatedAt: new Date("2026-09-19T12:00:00Z"),
    membrete: {
      lineas: [...PLANTILLA_MEMBRETE_CEFOA45],
      logoIzq: "none",
      logoDer: "none",
    },
  });

  const parsed = await parseAspirantesCensoXlsxBuffer(buffer);
  assert.ok(parsed.columnIds.includes("cedula"));
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0]?.cedula, "21425976");
});

test("el contacto de emergencia sale con el teléfono en formato 04xx-xxxxxxx", async () => {
  const row = sampleRow();
  row.telefono = "04262672790";
  row.contactoNombre = "MARIA OSUNA";
  row.contactoParentesco = "Mama";
  row.contactoTelefono = "4243321795";

  const buffer = await buildAspirantesCensoXlsxBuffer({
    convocatoriaNombre: "CEFOA 46",
    convocatoriaCodigo: "CEFOA-46",
    anio: 2026,
    rows: [row],
    columnIds: ["numero", "nombreCompleto", "cedula", "telefono", "contactoEmergencia"],
    generatedAt: new Date("2026-09-19T12:00:00Z"),
    membrete: null,
  });

  const parsed = await parseAspirantesCensoXlsxBuffer(buffer);
  assert.ok(parsed.columnIds.includes("contactoEmergencia"));
  assert.ok(parsed.columnIds.includes("contactoTelefono"));
  assert.equal(parsed.rows[0]?.values.telefono, "0426-2672790");
  assert.equal(parsed.rows[0]?.values.contactoTelefono, "0424-3321795");
  assert.equal(parsed.rows[0]?.values.contactoEmergencia, "MARIA OSUNA · Mama · 0424-3321795");
});

test("el membrete con escudos del Ejército y C.E.F.O.A. sigue importándose", async () => {
  const buffer = await buildAspirantesCensoXlsxBuffer({
    convocatoriaNombre: "CEFOA 46",
    convocatoriaCodigo: "CEFOA-46",
    anio: 2026,
    rows: [sampleRow()],
    columnIds: ["numero", "nombreCompleto", "cedula"],
    generatedAt: new Date("2026-09-19T12:00:00Z"),
    membrete: {
      lineas: [...PLANTILLA_MEMBRETE_CEFOA45],
      logoIzq: "ejercito",
      logoDer: "cefoa",
    },
  });

  const parsed = await parseAspirantesCensoXlsxBuffer(buffer);
  assert.equal(parsed.rows[0]?.cedula, "21425976");
});

test("el título escrito queda encima de las columnas y el censo sigue importándose", async () => {
  const buffer = await buildAspirantesCensoXlsxBuffer({
    convocatoriaNombre: "CEFOA 46",
    convocatoriaCodigo: "CEFOA-46",
    anio: 2026,
    rows: [sampleRow()],
    columnIds: ["numero", "nombreCompleto", "cedula"],
    generatedAt: new Date("2026-09-19T12:00:00Z"),
    membrete: null,
    titulo: "LISTADO DEL CURSO 46",
  });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("Censo");
  assert.ok(ws);
  assert.equal(ws.getCell("A1").value, "LISTADO DEL CURSO 46");
  assert.ok(ws.model.merges.some((range) => range.startsWith("A1:C")));
  const parsed = await parseAspirantesCensoXlsxBuffer(buffer);
  assert.equal(parsed.rows[0]?.cedula, "21425976");
});

test("el membrete ocupa solo las columnas exportadas y no queda inmovilizado", async () => {
  const buffer = await buildAspirantesCensoXlsxBuffer({
    convocatoriaNombre: "CEFOA 46",
    convocatoriaCodigo: "CEFOA-46",
    anio: 2026,
    rows: [sampleRow()],
    columnIds: ["numero", "edad", "sexo"],
    generatedAt: new Date("2026-09-19T12:00:00Z"),
    membrete: {
      lineas: [...PLANTILLA_MEMBRETE_CEFOA45],
      logoIzq: "ejercito",
      logoDer: "cefoa",
    },
  });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.getWorksheet("Censo");
  assert.ok(ws);
  assert.ok(ws.model.merges.some((range) => range.startsWith("A1:C")));
  assert.equal(ws.model.merges.some((range) => /:[D-Z]/.test(range)), false);
  assert.equal((ws.views ?? []).some((view) => view.state === "frozen"), false);
  assert.ok(ws.getTable("Censo"));
  const sum = [1, 2, 3].reduce((total, col) => total + (ws.getColumn(col).width ?? 0), 0);
  assert.ok(sum > 6 + 8 + 12);
  assert.ok((ws.getColumn(2).width ?? 0) >= (ws.getColumn(1).width ?? 0));
});
