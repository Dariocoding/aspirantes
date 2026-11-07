import assert from "node:assert/strict";
import { test } from "node:test";
import { extraerCedula, formatearRolesMes } from "./consulta-cedula";

test("extraerCedula acepta números, puntos y V delante", () => {
  assert.equal(extraerCedula("12345678"), "12345678");
  assert.equal(extraerCedula("12.345.678"), "12345678");
  assert.equal(extraerCedula("V-12345678"), "12345678");
  assert.equal(extraerCedula("mi cedula es 12.345.678"), "12345678");
  assert.equal(extraerCedula("/start"), null);
  assert.equal(extraerCedula("hola"), null);
  assert.equal(extraerCedula("04141234567"), null);
  assert.equal(extraerCedula("12345678 y 87654321"), null);
});

test("formatearRolesMes lista roles y dice si no hay cédula", () => {
  const conRoles = formatearRolesMes({
    anio: 2026,
    mes: 11,
    personas: [
      {
        apellidos: "Lugo Rico",
        nombres: "Aniuska",
        cedula: "12345678",
        roles: [
          { nombre: "COMEDOR FEMENINA", dias: [{ dia: 10, marca: "X" }] },
          { nombre: "ESTACIONAMIENTO", dias: [{ dia: 8, marca: "T2" }] },
        ],
      },
    ],
  });
  assert.match(conRoles, /LUGO RICO ANIUSKA/);
  assert.match(conRoles, /12\.345\.678/);
  assert.match(conRoles, /Noviembre 2026/);
  assert.match(conRoles, /día 8 T2[\s\S]*día 10/);

  const vacio = formatearRolesMes({ anio: 2026, mes: 11, personas: [] });
  assert.match(vacio, /No encontré esa cédula/);
});
