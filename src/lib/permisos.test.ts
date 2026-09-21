import assert from "node:assert/strict";
import { test } from "node:test";
import { estadoPermiso, formatDuracionPermiso, rangesOverlap } from "@src/lib/permisos";

test("estadoPermiso distingue programado, vigente, finalizado y anulado", () => {
  const inicio = new Date(2026, 8, 21, 8, 0, 0);
  const fin = new Date(2026, 8, 21, 18, 0, 0);
  assert.equal(
    estadoPermiso({ fechaInicio: inicio, fechaFin: fin, anulado: false, now: new Date(2026, 8, 21, 7, 0, 0) }),
    "PROGRAMADO",
  );
  assert.equal(
    estadoPermiso({ fechaInicio: inicio, fechaFin: fin, anulado: false, now: new Date(2026, 8, 21, 12, 0, 0) }),
    "VIGENTE",
  );
  assert.equal(
    estadoPermiso({ fechaInicio: inicio, fechaFin: fin, anulado: false, now: new Date(2026, 8, 21, 19, 0, 0) }),
    "FINALIZADO",
  );
  assert.equal(
    estadoPermiso({ fechaInicio: inicio, fechaFin: fin, anulado: true, now: new Date(2026, 8, 21, 12, 0, 0) }),
    "ANULADO",
  );
});

test("rangesOverlap detecta cruce de permisos", () => {
  const a = new Date(2026, 8, 21, 8, 0, 0);
  const b = new Date(2026, 8, 21, 14, 0, 0);
  const c = new Date(2026, 8, 21, 12, 0, 0);
  const d = new Date(2026, 8, 21, 18, 0, 0);
  const e = new Date(2026, 8, 21, 15, 0, 0);
  const f = new Date(2026, 8, 21, 20, 0, 0);
  assert.equal(rangesOverlap(a, b, c, d), true);
  assert.equal(rangesOverlap(a, b, e, f), false);
});

test("formatDuracionPermiso resume horas y días", () => {
  assert.equal(
    formatDuracionPermiso(new Date(2026, 8, 21, 8, 0, 0), new Date(2026, 8, 21, 18, 0, 0)),
    "10 horas",
  );
  assert.equal(
    formatDuracionPermiso(new Date(2026, 8, 21, 8, 0, 0), new Date(2026, 8, 23, 8, 0, 0)),
    "2 días",
  );
});
