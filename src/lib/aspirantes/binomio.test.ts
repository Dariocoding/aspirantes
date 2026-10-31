import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agruparFilasBinomio,
  claveParejaBinomio,
  codigoCompaneroBinomio,
  esCodigoBinomioImpar,
  normalizarCodigoBinomio,
} from "./binomio";

test("normalizarCodigoBinomio", () => {
  assert.equal(normalizarCodigoBinomio("a1"), "A01");
  assert.equal(normalizarCodigoBinomio("B15"), "B15");
  assert.equal(normalizarCodigoBinomio(""), null);
  assert.equal(normalizarCodigoBinomio("XX"), null);
});

test("pareja impar/par (cazare = número consecutivo)", () => {
  assert.equal(claveParejaBinomio("A01"), "A01");
  assert.equal(claveParejaBinomio("A02"), "A01");
  assert.equal(codigoCompaneroBinomio("A01"), "A02");
  assert.equal(codigoCompaneroBinomio("A02"), "A01");
  assert.equal(codigoCompaneroBinomio("A15"), "A16");
  assert.equal(codigoCompaneroBinomio("B33"), "B34");
  assert.equal(codigoCompaneroBinomio("B34"), "B33");
  assert.equal(codigoCompaneroBinomio("B35"), "B36");
  assert.equal(esCodigoBinomioImpar("A01"), true);
  assert.equal(esCodigoBinomioImpar("A02"), false);
});

test("agrupa A01-A02 en una fila", () => {
  const { parejas, sinCodigo } = agruparFilasBinomio([
    {
      nombres: "Uno",
      apellidos: "Impar",
      cedula: "1",
      sexo: "MASCULINO",
      codigoBinomio: "A01",
      pelotonLabel: "Pelotón 1",
      pelotonNumero: 1,
    },
    {
      nombres: "Dos",
      apellidos: "Par",
      cedula: "2",
      sexo: "MASCULINO",
      codigoBinomio: "A02",
      pelotonLabel: "Pelotón 1",
      pelotonNumero: 1,
    },
    {
      nombres: "Solo",
      apellidos: "Sin",
      cedula: "3",
      sexo: "FEMENINO",
      codigoBinomio: null,
      pelotonLabel: null,
      pelotonNumero: null,
    },
  ]);

  assert.equal(parejas.length, 1);
  assert.equal(parejas[0]!.clave, "A01");
  assert.equal(parejas[0]!.p1?.cedula, "1");
  assert.equal(parejas[0]!.p2?.cedula, "2");
  assert.equal(sinCodigo.length, 1);
});
