import assert from "node:assert/strict";
import { test } from "node:test";
import { coincidenciaRol, type AspiranteParaRol } from "@src/lib/roles-servicio/match";

const CENSO: AspiranteParaRol[] = [
  { id: "jessica", nombres: "JESSICA CELIA", apellidos: "FUENTES MORA" },
  { id: "jessica-2", nombres: "JESSICA", apellidos: "FUENTES RIVAS" },
  { id: "pedro", nombres: "PEDRO RICARDO", apellidos: "TINAURE ESCOBAR" },
  { id: "sara", nombres: "SARA", apellidos: "ROJAS TORRES" },
  { id: "darwin", nombres: "DARWIN JOSE", apellidos: "QUINTERO HERNANDEZ" },
  { id: "diego", nombres: "DIEGO", apellidos: "LOPEZ CABALLERO" },
  { id: "yuletzys", nombres: "YULETZYS CORAIMA", apellidos: "GARCIA" },
];

test("vincula un nombre abreviado con el aspirante único", () => {
  const resultado = coincidenciaRol("YULETZYS GARCIA", CENSO);
  assert.equal(resultado.status, "vinculado");
  if (resultado.status === "vinculado") assert.equal(resultado.aspiranteId, "yuletzys");
});

test("tolera una letra distinta y un cero escrito en el apellido", () => {
  assert.equal(coincidenciaRol("PEDRO TIMAURE", CENSO).status, "vinculado");
  assert.equal(coincidenciaRol("SARA ROJA TORRES", CENSO).status, "vinculado");
  assert.equal(coincidenciaRol("DARWIN QUINTERO HERNÁDEZ", CENSO).status, "vinculado");
  const diego = coincidenciaRol("DIEGO LÓPEZ CABALLER0", CENSO);
  assert.equal(diego.status, "vinculado");
  if (diego.status === "vinculado") assert.equal(diego.aspiranteId, "diego");
});

test("no vincula cuando dos aspirantes comparten el nombre del rol", () => {
  const resultado = coincidenciaRol("JESSICA FUENTES", CENSO);
  assert.equal(resultado.status, "ambiguo");
});

test("LEANDRO CONTRERAS del rol queda como LEONDER CONTRERAS", () => {
  const personas: AspiranteParaRol[] = [
    { id: "leonder", nombres: "LEONDER", apellidos: "CONTRERAS" },
    { id: "yein", nombres: "YEIN DANIEL", apellidos: "CONTRERAS ARAY" },
  ];
  const resultado = coincidenciaRol("LEANDRO CONTRERAS", personas);
  assert.equal(resultado.status, "vinculado");
  if (resultado.status === "vinculado") assert.equal(resultado.aspiranteId, "leonder");
});

test("un nombre vacío no coincide", () => {
  assert.equal(coincidenciaRol("   ", CENSO).status, "sin_coincidencia");
});
