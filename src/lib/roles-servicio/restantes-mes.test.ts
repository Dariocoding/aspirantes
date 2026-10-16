import assert from "node:assert/strict";
import { test } from "node:test";
import {
  diaDesdeRestantes,
  formatearRestantesMes,
  nombreArchivoRestantes,
} from "@src/lib/roles-servicio/restantes-mes";

test("diaDesdeRestantes usa hoy en el mes actual", () => {
  const ahora = new Date(2026, 9, 16);
  assert.equal(diaDesdeRestantes(2026, 10, ahora), 16);
  assert.equal(diaDesdeRestantes(2026, 9, ahora), 1);
});

test("formatea por rol, persona y día solo desde la fecha", () => {
  const texto = formatearRestantesMes({
    anio: 2026,
    mes: 10,
    desde: 20,
    generadoEn: new Date(2026, 9, 16, 12, 0, 0),
    planes: [
      {
        clave: "enfermeria",
        nombre: "ENFERMERIA",
        curso: "CEFOA 46",
        asignaciones: [
          {
            orden: 1,
            grado: "ASP/OFIC",
            nombre: "ANA",
            dias: [
              { dia: 10, marca: "X" },
              { dia: 22, marca: "X" },
            ],
            aspirante: { nombres: "ANA", apellidos: "PEREZ" },
            autoridad: null,
          },
        ],
      },
      {
        clave: "estacionamiento",
        nombre: "GUARDIA ESTACIONAMIENTO NOCTURNO",
        curso: "CEFOA 46",
        asignaciones: [
          {
            orden: 1,
            grado: "ASP/OFIC",
            nombre: "LUIS",
            dias: [{ dia: 25, marca: "T1" }],
            aspirante: { nombres: "LUIS", apellidos: "GOMEZ" },
            autoridad: null,
          },
        ],
      },
    ],
  });

  assert.match(texto, /SERVICIOS RESTANTES DEL MES/);
  assert.match(texto, /Desde el día 20/);
  assert.match(texto, /1\. POR ROL/);
  assert.match(texto, /2\. POR PERSONA/);
  assert.match(texto, /3\. POR DÍA/);
  assert.match(texto, /ANA PEREZ/);
  assert.match(texto, /22/);
  assert.doesNotMatch(texto, /Días: 10/);
  assert.match(texto, /25\(1ER\)/);
  assert.match(texto, /LUIS GOMEZ/);
});

test("nombre de archivo", () => {
  assert.equal(nombreArchivoRestantes(2026, 10, 16), "servicios-restantes-2026-10-desde-16.txt");
});
