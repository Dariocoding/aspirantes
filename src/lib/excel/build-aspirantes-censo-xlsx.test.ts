import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAspirantesCensoXlsxBuffer } from "./parse-aspirantes-censo-xlsx";
import { buildAspirantesCensoXlsxBuffer, type AspiranteCensoExportRow } from "./build-aspirantes-censo-xlsx";
import { PLANTILLA_MEMBRETE_CEFOA45 } from "@src/lib/membrete";

function sampleRow(): AspiranteCensoExportRow {
  return {
    nombres: "JUNIOR ALBANIS",
    apellidos: "CAÑIZALES ROSALES",
    unidadPostulante: "Unidad",
    tituloUniversidad: null,
    tipoEstudio: null,
    cedula: "21425976",
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
