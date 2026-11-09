import assert from "node:assert/strict";
import test from "node:test";
import {
  pelotonDeclaradoEnRol,
  personaCoincide,
  rolCoincide,
  sexoDeclaradoEnRol,
} from "./coincidencias";

const morao = {
  apellidos: "Morao Mujica",
  nombres: "José Francisco",
  cedula: "28.345.219",
};

test("encuentra a la persona por nombre o cédula", () => {
  assert.equal(personaCoincide(morao, "jose francisco morao"), true);
  assert.equal(personaCoincide(morao, "28345219"), true);
  assert.equal(personaCoincide(morao, "glorinanny salazar"), false);
});

test("el rol coincide por todas las palabras", () => {
  assert.equal(rolCoincide("GUARDIA BAÑO 2DO PELOTÓN MASCULINO", "baño 2do masculino"), true);
  assert.equal(rolCoincide("COMEDOR FEMENINA", "comedor masculino"), false);
});

test("lee sexo y pelotón del nombre del rol", () => {
  assert.equal(sexoDeclaradoEnRol("CUARTELERO 1ER PELOTÓN MASCULINO"), "MASCULINO");
  assert.equal(sexoDeclaradoEnRol("COMEDOR FEMENINA"), "FEMENINO");
  assert.equal(pelotonDeclaradoEnRol("CUARTELERO 1ER PELOTÓN MASCULINO"), 1);
  assert.equal(pelotonDeclaradoEnRol("GUARDIA BAÑO 2DO PELOTÓN FEMENINO"), 2);
  assert.equal(pelotonDeclaradoEnRol("COMEDOR MASCULINO"), null);
});
