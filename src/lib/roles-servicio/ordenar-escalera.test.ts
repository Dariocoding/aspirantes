import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compararEscalera,
  ordenarAsignacionesEscalera,
  primerDiaMarca,
} from "@src/lib/roles-servicio/ordenar-escalera";

test("primerDiaMarca toma el día más temprano", () => {
  assert.equal(primerDiaMarca([]), null);
  assert.equal(primerDiaMarca([{ dia: 10, marca: "X" }, { dia: 3, marca: "X" }]), 3);
});

test("ordenarAsignacionesEscalera arma la diagonal por primer día", () => {
  const filas = [
    { id: "c", orden: 1, dias: [{ dia: 12, marca: "X" }] },
    { id: "a", orden: 2, dias: [{ dia: 1, marca: "X" }, { dia: 15, marca: "X" }] },
    { id: "b", orden: 3, dias: [{ dia: 5, marca: "X" }] },
    { id: "z", orden: 4, dias: [] },
  ];
  const out = ordenarAsignacionesEscalera(filas);
  assert.deepEqual(
    out.map((item) => ({ id: item.id, orden: item.orden })),
    [
      { id: "a", orden: 1 },
      { id: "b", orden: 2 },
      { id: "c", orden: 3 },
      { id: "z", orden: 4 },
    ],
  );
});

test("mismo día prioriza T1 antes que T2", () => {
  const cmp = compararEscalera(
    { orden: 2, dias: [{ dia: 7, marca: "T2" }] },
    { orden: 1, dias: [{ dia: 7, marca: "T1" }] },
  );
  assert.ok(cmp > 0);
});
