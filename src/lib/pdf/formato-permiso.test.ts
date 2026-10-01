import assert from "node:assert/strict";
import { test } from "node:test";
import {
  companiaPermiso,
  DEFAULT_FORMATO_PERMISO,
  FORMATO_PERMISO_EJEMPLO,
  jerarquiaPermiso,
  normalizeFormatoPermiso,
  presentarFormatoPermiso,
} from "@src/lib/pdf/formato-permiso";

test("la jerarquía sale de la condición militar, sin el sufijo activo", () => {
  assert.equal(jerarquiaPermiso("SARGENTO_ACTIVO"), "SARGENTO");
  assert.equal(jerarquiaPermiso("SOLDADO_ACTIVO"), "SOLDADO");
  assert.equal(jerarquiaPermiso(null), "");
});

test("la compañía fija del formato pisa pelotón y unidad", () => {
  assert.equal(companiaPermiso("2504 Cia de comunicaciones", "Pelotón 1", "Otra"), "2504 CIA DE COMUNICACIONES");
  assert.equal(companiaPermiso("", "Pelotón 1", "Otra"), "PELOTÓN 1");
  assert.equal(companiaPermiso("  ", null, "Brigada"), "BRIGADA");
  assert.equal(companiaPermiso("", null, "  "), "");
});

test("la boleta individual arma fechas, duración y firmante de la convocatoria", () => {
  const slip = presentarFormatoPermiso(DEFAULT_FORMATO_PERMISO, {
    ...FORMATO_PERMISO_EJEMPLO,
    fechaInicio: new Date(2018, 3, 11),
    fechaFin: new Date(2018, 3, 14),
    comandanteNombre: "1er Tte Jesús Manuel Rodríguez",
    anulado: true,
  });

  assert.equal(slip.titulo, "BOLETA DE PERMISO");
  assert.equal(slip.jerarquia, "SARGENTO");
  assert.equal(slip.apellidos, "PÉREZ GARCÍA");
  assert.equal(slip.cedula, "12345678");
  assert.equal(slip.compania, "PELOTÓN 1");
  assert.equal(slip.desde, "11/4/2018");
  assert.equal(slip.hasta, "14/4/2018");
  assert.equal(slip.duracion, "3 DÍAS");
  assert.equal(slip.tipo, "FIN DE SEMANA");
  assert.equal(slip.telefono, "04120000000");
  assert.equal(slip.direccion, "SECTOR EJEMPLO, ESTADO MÉRIDA");
  assert.equal(slip.firmanteNombre, "1ER TTE JESÚS MANUEL RODRÍGUEZ");
  assert.equal(slip.anulado, true);
  assert.match(slip.nota, /^NOTA:/);
});

test("un firmante escrito en el formato no usa el comandante", () => {
  const slip = presentarFormatoPermiso(
    { ...DEFAULT_FORMATO_PERMISO, firmanteNombre: "Cmdte. Propio", compania: "CEFOA" },
    { ...FORMATO_PERMISO_EJEMPLO, comandanteNombre: "Otro" },
  );
  assert.equal(slip.firmanteNombre, "CMDTE. PROPIO");
  assert.equal(slip.compania, "CEFOA");
});

test("un formato guardado incompleto vuelve a los textos por defecto", () => {
  const plantilla = normalizeFormatoPermiso({
    lineas: [],
    logoIzq: "ninguno" as never,
    titulo: "  ",
    nota: "",
  });
  assert.deepEqual(plantilla.lineas, DEFAULT_FORMATO_PERMISO.lineas);
  assert.equal(plantilla.logoIzq, "ejercito");
  assert.equal(plantilla.titulo, "BOLETA DE PERMISO");
  assert.equal(plantilla.nota, "");
});
