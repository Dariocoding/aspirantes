import assert from "node:assert/strict";
import { test } from "node:test";
import { FOLD_BUSQUEDA_FROM, FOLD_BUSQUEDA_TO, foldBusqueda } from "@src/lib/text/fold";

test("el mapa de búsqueda tiene el mismo largo en origen y destino", () => {
  assert.equal(FOLD_BUSQUEDA_FROM.length, FOLD_BUSQUEDA_TO.length);
});

test("la búsqueda ignora mayúsculas y tildes", () => {
  assert.equal(foldBusqueda("Darío"), "dario");
  assert.equal(foldBusqueda("dario"), "dario");
  assert.equal(foldBusqueda("DARIO"), "dario");
  assert.equal(foldBusqueda("JOSÉ"), "jose");
  assert.equal(foldBusqueda("Núñez"), "nunez");
  assert.equal(foldBusqueda("Peña"), "pena");
  assert.equal(foldBusqueda("Güerere"), "guerere");
  assert.equal(foldBusqueda("Dari\u0301o"), "dario");
});
