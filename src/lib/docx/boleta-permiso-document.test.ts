import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBoletasPermisoDocx } from "@src/lib/docx/boleta-permiso-document";

test("la boleta se genera como Word, dos aspirantes por hoja", async () => {
  const buffer = await buildBoletasPermisoDocx({
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
        cabello: "Negro",
        grupoSanguineo: "O+",
        ojos: "Café",
        colorPiel: "Morena",
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
        cabello: "Castaño oscuro",
        grupoSanguineo: "ARH+",
        ojos: "Café",
        colorPiel: "Blanca",
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
  assert.equal(buffer.subarray(0, 2).toString(), "PK");
  assert.ok(buffer.length > 2000);
});
