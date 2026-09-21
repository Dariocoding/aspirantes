import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBoletasPermisoDocx } from "@src/lib/docx/boleta-permiso-document";

test("la boleta se genera como archivo Word (docx)", async () => {
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
        telefono: "(0412) 000-0000",
        emergenciaDireccion: "Calle 2",
        emergenciaTelefonos: ["(0416) 111-1111"],
        foto: null,
      },
    ],
    logoCefoa: null,
    logoEjercito: null,
  });
  assert.equal(buffer.subarray(0, 2).toString(), "PK");
  assert.ok(buffer.length > 2000);
});
