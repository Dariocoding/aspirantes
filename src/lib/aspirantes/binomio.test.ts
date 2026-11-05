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

test("intercala un binomio femenino y uno masculino", () => {
  const persona = (
    nombres: string,
    sexo: "FEMENINO" | "MASCULINO",
    codigo: string,
    peloton: number,
  ) => ({
    nombres,
    apellidos: "Prueba",
    cedula: codigo,
    sexo,
    codigoBinomio: codigo,
    pelotonLabel: `Pelotón ${peloton}`,
    pelotonNumero: peloton,
  });

  const { parejas } = agruparFilasBinomio([
    persona("Ana", "FEMENINO", "A01", 1),
    persona("Bea", "FEMENINO", "A02", 1),
    persona("Carla", "FEMENINO", "A03", 1),
    persona("Dora", "FEMENINO", "A04", 1),
    persona("Luis", "MASCULINO", "B01", 1),
    persona("Mario", "MASCULINO", "B02", 1),
    persona("Eva", "FEMENINO", "C01", 2),
    persona("Fabi", "FEMENINO", "C02", 2),
    persona("Nico", "MASCULINO", "D01", 2),
    persona("Omar", "MASCULINO", "D02", 2),
    persona("Pablo", "MASCULINO", "D03", 2),
    persona("Raul", "MASCULINO", "D04", 2),
  ]);

  assert.deepEqual(
    parejas.map((fila) => `${fila.clave}:${fila.sexo}`),
    ["A01:Femenino", "B01:Masculino", "A03:Femenino", "D01:Masculino", "C01:Femenino", "D03:Masculino"],
  );
});
