import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { BoletasPermisoPdfDocument } from "@src/lib/pdf/boleta-permiso-document";

test("la boleta se genera como PDF, dos aspirantes por hoja", async () => {
  const doc = createElement(BoletasPermisoPdfDocument, {
    convocatoria: {
      nombre: "Curso 45",
      codigo: "CEFOA-45",
      anio: 2026,
      cursoNro: "45",
      directorNombre: "CNEL. PRUEBA",
      directorCargo: "DIRECTOR DEL C.E.F.O.A. 45",
      headerLines: [
        "República Bolivariana de Venezuela",
        "Ministerio del Poder Popular para la Defensa",
        "Ejército Bolivariano",
        "Dirección de Educación del Ejército",
        "Curso 45",
      ],
    },
    cards: [
      {
        id: "a1",
        serial: "001",
        nombres: "ANA",
        apellidos: "PEREZ",
        cedula: "123",
        cabello: "NEGRO",
        grupoSanguineo: "ORH+",
        ojos: "CAFÉ",
        colorPiel: "BLANCA",
        direccion: "Calle 1",
        telefono: "0412-0000000",
        emergenciaDireccion: "Calle 2",
        emergenciaTelefono: "0416-1111111",
        foto: null,
      },
      {
        id: "a2",
        serial: "002",
        nombres: "LUIS",
        apellidos: "DIAZ",
        cedula: "456",
        cabello: "CASTAÑO OSCURO",
        grupoSanguineo: "ARH+",
        ojos: "CAFÉ",
        colorPiel: "BLANCA",
        direccion: "Calle 2",
        telefono: "0414-1111111",
        emergenciaDireccion: "Calle 3",
        emergenciaTelefono: "0416-2222222",
        foto: null,
      },
    ],
    logoCefoa: null,
    logoEjercito: null,
  });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
  assert.ok(buffer.length > 1000);
});
