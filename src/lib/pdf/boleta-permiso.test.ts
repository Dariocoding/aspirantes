import assert from "node:assert/strict";
import { test } from "node:test";
import {
  boletaRankByApellidos,
  cursoNroFromConvocatoria,
  formatBoletaSerial,
  formatTelefonoBoleta,
  formatVenceBoleta,
  formatGrupoSanguineoBoleta,
  formatRasgoBoleta,
  parseBoletaIdsParam,
} from "@src/lib/pdf/boleta-permiso";

test("el serial del carnet va con tres dígitos", () => {
  assert.equal(formatBoletaSerial(1), "001");
  assert.equal(formatBoletaSerial(45), "045");
});

test("el ranking por apellidos se conserva aunque se descargue un subconjunto", () => {
  const ranks = boletaRankByApellidos([
    { id: "b", nombres: "Ana", apellidos: "Zerpa", cedula: "2" },
    { id: "a", nombres: "Luis", apellidos: "Abreu", cedula: "1" },
  ]);
  assert.equal(ranks.get("a"), 1);
  assert.equal(ranks.get("b"), 2);
});

test("el número de curso sale del código de la convocatoria", () => {
  assert.equal(cursoNroFromConvocatoria({ codigo: "CEFOA-45", nombre: "Curso" }), "45");
  assert.equal(
    cursoNroFromConvocatoria({ codigo: "X", nombre: "Curso Especial Nro. 46" }),
    "46",
  );
});

test("vence en julio del año de la convocatoria", () => {
  assert.equal(formatVenceBoleta(2027), "VENCE JULIO 2027");
});

test("formatea teléfonos como en la plantilla", () => {
  assert.equal(formatTelefonoBoleta("04123968855"), "0412-3968855");
});

test("el grupo sanguíneo de la boleta usa el formato ORH+", () => {
  assert.equal(formatGrupoSanguineoBoleta("O", "POSITIVO"), "ORH+");
  assert.equal(formatGrupoSanguineoBoleta("B", "NEGATIVO"), "BRH-");
  assert.equal(formatGrupoSanguineoBoleta("AB", "POSITIVO"), "ABRH+");
});

test("el color de piel clara se imprime BLANCA", () => {
  assert.equal(formatRasgoBoleta("Clara"), "BLANCA");
  assert.equal(formatRasgoBoleta("Morena"), "MORENA");
});

test("parseBoletaIdsParam recorta duplicados", () => {
  assert.deepEqual(parseBoletaIdsParam("a,a, b"), ["a", "b"]);
});
