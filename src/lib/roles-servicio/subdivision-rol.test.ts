import assert from "node:assert/strict";
import test from "node:test";
import {
  etiquetaSubdivision,
  subdivisionDesdeNombreRol,
} from "./subdivision-rol";

test("baño femenina 1er pelotón", () => {
  assert.deepEqual(
    subdivisionDesdeNombreRol("GUARDIA BAÑO FEMENINA DEL 1ER PELOTÓN"),
    { sexo: "FEMENINO", pelotonNumero: 1 },
  );
});

test("cuartelero masculino 2do", () => {
  assert.deepEqual(
    subdivisionDesdeNombreRol("CUARTELERO 2DO PELOTÓN MASCULINO"),
    { sexo: "MASCULINO", pelotonNumero: 2 },
  );
});

test("comedor solo sexo", () => {
  assert.deepEqual(subdivisionDesdeNombreRol("COMEDOR MASCULINO"), {
    sexo: "MASCULINO",
    pelotonNumero: null,
  });
  assert.deepEqual(subdivisionDesdeNombreRol("COMEDOR FEMENINA"), {
    sexo: "FEMENINO",
    pelotonNumero: null,
  });
});

test("inspección solo pelotón", () => {
  assert.deepEqual(subdivisionDesdeNombreRol("INSPECCIÓN DEL 1ER PELOTÓN"), {
    sexo: null,
    pelotonNumero: 1,
  });
});

test("sin subdivisión", () => {
  assert.deepEqual(subdivisionDesdeNombreRol("ENFERMERIA"), {
    sexo: null,
    pelotonNumero: null,
  });
});

test("cuartelera implica femenino", () => {
  assert.equal(subdivisionDesdeNombreRol("CUARTELERA DEL 1ER PELOTÓN").sexo, "FEMENINO");
  assert.equal(subdivisionDesdeNombreRol("CUARTELERO DEL 1ER PELOTÓN").sexo, "MASCULINO");
});

test("etiqueta legible", () => {
  assert.equal(
    etiquetaSubdivision({ sexo: "FEMENINO", pelotonNumero: 1 }),
    "femeninas · 1er pelotón",
  );
});
