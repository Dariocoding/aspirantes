import assert from "node:assert/strict";
import { test } from "node:test";
import { clavePersona } from "./generar-rotacion";
import {
  cambiosAlAplicarSugerencias,
  detectarRepeticionesDiurnas,
  esGuardiaDiurna,
  mensajeChoqueDiurno,
  sugerirRelevosDiurnos,
  type PlanDiurno,
} from "./repeticiones-diurno";

function plan(
  clave: string,
  nombre: string,
  asignaciones: PlanDiurno["asignaciones"],
  extra?: Partial<PlanDiurno>,
): PlanDiurno {
  return { clave, nombre, asignaciones, ...extra };
}

function persona(
  id: string,
  etiqueta: string,
  dias: Array<{ dia: number; marca?: string }>,
  aspiranteId?: string,
): PlanDiurno["asignaciones"][number] {
  return {
    id,
    orden: 1,
    grado: "Asp.",
    nombre: etiqueta,
    etiqueta,
    aspiranteId: aspiranteId ?? null,
    autoridadId: null,
    dias: dias.map((item) => ({ dia: item.dia, marca: item.marca ?? "X" })),
  };
}

test("estacionamiento y nocturno no son guardia diurna", () => {
  assert.equal(esGuardiaDiurna({ nombre: "OFICIAL DE DIA" }), true);
  assert.equal(esGuardiaDiurna({ nombre: "GUARDIA ESTACIONAMIENTO NOCTURNO" }), false);
  assert.equal(esGuardiaDiurna({ nombre: "RONDA NOCTURNA" }), false);
  assert.equal(esGuardiaDiurna({ nombre: "COMEDOR", turnoEnMarca: true }), false);
});

test("detecta a la misma persona en dos diurnos el mismo día", () => {
  const planes = [
    plan("oficial", "OFICIAL DE DIA", [persona("a1", "ANA", [{ dia: 4 }], "asp-ana")]),
    plan("comedor", "COMEDOR", [persona("a2", "ANA", [{ dia: 4 }], "asp-ana")]),
    plan("est", "GUARDIA ESTACIONAMIENTO NOCTURNO", [
      persona("a3", "ANA", [{ dia: 4, marca: "T1" }], "asp-ana"),
    ]),
  ];
  const repeticiones = detectarRepeticionesDiurnas(planes);
  assert.equal(repeticiones.length, 1);
  assert.equal(repeticiones[0]?.dia, 4);
  assert.deepEqual(
    repeticiones[0]?.puestos.map((puesto) => puesto.planNombre),
    ["OFICIAL DE DIA", "COMEDOR"],
  );
});

test("sugiere a quien lleva más tiempo sin diurno y deja el oficial", () => {
  const planes = [
    plan("oficial", "OFICIAL DE DIA", [
      persona("ana-of", "ANA", [{ dia: 5 }], "asp-ana"),
      persona("beto-of", "BETO", [{ dia: 1 }], "asp-beto"),
    ]),
    plan("comedor", "COMEDOR", [
      persona("ana-co", "ANA", [{ dia: 5 }], "asp-ana"),
      persona("luis-co", "LUIS", [{ dia: 2 }], "asp-luis"),
      persona("cara-co", "CARA", [{ dia: 4 }], "asp-cara"),
    ]),
  ];
  const sugerencias = sugerirRelevosDiurnos(planes);
  assert.equal(sugerencias.length, 1);
  assert.equal(sugerencias[0]?.seQuedaEn, "OFICIAL DE DIA");
  assert.equal(sugerencias[0]?.moverDe.planNombre, "COMEDOR");
  assert.equal(sugerencias[0]?.relevo?.nombre, "LUIS");

  const cambios = cambiosAlAplicarSugerencias(planes, sugerencias);
  const anaComedor = cambios.find((item) => item.asignacionId === "ana-co");
  const luis = cambios.find((item) => item.asignacionId === "luis-co");
  assert.deepEqual(anaComedor?.dias, []);
  assert.deepEqual(luis?.dias, [
    { dia: 2, marca: "X" },
    { dia: 5, marca: "X" },
  ]);
  assert.equal(detectarRepeticionesDiurnas(aplicar(planes, cambios)).length, 0);
});

test("no propone a quien ya tiene otro diurno ese día", () => {
  const planes = [
    plan("oficial", "OFICIAL DE DIA", [persona("ana-of", "ANA", [{ dia: 3 }], "asp-ana")]),
    plan("comedor", "COMEDOR", [
      persona("ana-co", "ANA", [{ dia: 3 }], "asp-ana"),
      persona("luis-co", "LUIS", [{ dia: 3 }], "asp-luis"),
    ]),
    plan("aula", "AULA", [persona("luis-au", "LUIS", [{ dia: 3 }], "asp-luis")]),
  ];
  const sugerencias = sugerirRelevosDiurnos(planes);
  const deAna = sugerencias.find((item) => item.nombre === "ANA" && item.moverDe.planNombre === "COMEDOR");
  assert.equal(deAna?.relevo, null);
});

test("mensaje de choque solo en diurno", () => {
  const planes = [
    plan("oficial", "OFICIAL DE DIA", [persona("ana-of", "ANA", [{ dia: 8 }], "asp-ana")]),
    plan("comedor", "COMEDOR", [persona("ana-co", "ANA", [], "asp-ana")]),
    plan("est", "GUARDIA ESTACIONAMIENTO NOCTURNO", [persona("ana-es", "ANA", [], "asp-ana")]),
  ];
  assert.match(mensajeChoqueDiurno(planes, "ana-co", 8) ?? "", /OFICIAL DE DIA/);
  assert.equal(mensajeChoqueDiurno(planes, "ana-es", 8), null);
  assert.equal(clavePersona({ asignacionId: "x", aspiranteId: "asp-ana", nombre: "ANA" }), "a:asp-ana");
});

function aplicar(
  planes: PlanDiurno[],
  cambios: Array<{ asignacionId: string; dias: PlanDiurno["asignaciones"][number]["dias"] }>,
): PlanDiurno[] {
  const mapa = new Map(cambios.map((cambio) => [cambio.asignacionId, cambio.dias]));
  return planes.map((plan) => ({
    ...plan,
    asignaciones: plan.asignaciones.map((asignacion) => ({
      ...asignacion,
      dias: mapa.get(asignacion.id) ?? asignacion.dias,
    })),
  }));
}
