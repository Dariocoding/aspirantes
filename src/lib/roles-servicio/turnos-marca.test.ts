import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOrdenNocturnoConfig } from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import { construirFilasNocturnas } from "@src/lib/roles-servicio/orden-del-dia/armar-nocturnos";
import { buildOrdenDelDia } from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import { deduplicarRoles, type RolParseado } from "@src/lib/roles-servicio/parse-excel";
import type { PersonaOrdenInput, PlanOrdenInput } from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import { turnoDesdeMarca } from "@src/lib/roles-servicio/turnos-marca";

function persona(orden: number, nombre: string, marca: string | null): PersonaOrdenInput {
  return {
    orden,
    grado: "ASP/OFIC",
    nombre,
    dias: marca ? [{ dia: 8, marca }] : [],
    aspirante: null,
    autoridad: null,
  };
}

function rol(parcial: Partial<RolParseado> & Pick<RolParseado, "clave" | "nombre">): RolParseado {
  return {
    curso: "CEFOA 46",
    sortOrder: 0,
    personas: [],
    ...parcial,
  };
}

test("T1, T2 y T3 son primer, segundo y tercer turno", () => {
  assert.equal(turnoDesdeMarca("T1")?.nombre, "Primer turno");
  assert.equal(turnoDesdeMarca("t2")?.etiqueta, "2DO");
  assert.equal(turnoDesdeMarca("T3")?.etiqueta, "3ER");
  assert.equal(turnoDesdeMarca("X"), null);
});

test("si el título se repite, se queda la hoja de estacionamiento sin X", () => {
  const conX = rol({
    clave: "guardia-estacionamiento-nocturno-cefoa-46",
    nombre: "GUARDIA ESTACIONAMIENTO NOCTURNO",
    personas: [
      { orden: 1, grado: "ASP/OFIC", nombre: "A", dias: [{ dia: 8, marca: "T1" }, { dia: 9, marca: "X" }] },
    ],
  });
  const limpia = rol({
    clave: "guardia-estacionamiento-nocturno-cefoa-46",
    nombre: "GUARDIA ESTACIONAMIENTO NOCTURNO",
    personas: [{ orden: 1, grado: "ASP/OFIC", nombre: "A", dias: [{ dia: 8, marca: "T1" }] }],
  });
  const aula = rol({
    clave: "aula",
    nombre: "AULA MASCULINO",
    personas: [{ orden: 1, grado: "ASP/OFIC", nombre: "B", dias: [{ dia: 8, marca: "X" }] }],
  });

  const roles = deduplicarRoles([conX, limpia, aula]);
  assert.equal(roles.length, 2);
  const estacionamiento = roles.find((item) => item.clave.startsWith("guardia"));
  assert.deepEqual(estacionamiento?.personas[0]?.dias, [{ dia: 8, marca: "T1" }]);
  assert.equal(roles.find((item) => item.clave === "aula")?.personas[0]?.dias[0]?.marca, "X");
});

test("la orden nocturna coloca la guardia según T1 T2 T3 y no en el diurno", () => {
  const aula: PlanOrdenInput = {
    clave: "aula",
    nombre: "AULA MASCULINO",
    curso: "CEFOA 46",
    asignaciones: [persona(1, "ANA RIVAS", "X")],
  };
  const estacionamiento: PlanOrdenInput = {
    clave: "guardia-estacionamiento-nocturno-cefoa-46",
    nombre: "GUARDIA ESTACIONAMIENTO NOCTURNO",
    curso: "CEFOA 46",
    asignaciones: [
      persona(1, "DARÍO FLORES", "T2"),
      persona(2, "YANIS CALZADA", "T1"),
      persona(3, "CESAR RIVAS", "T3"),
      persona(4, "AUSENTE", "X"),
    ],
  };
  const config = defaultOrdenNocturnoConfig();
  config.binomios[0] = {
    ...config.binomios[0]!,
    rolClaves: ["aula", estacionamiento.clave],
  };

  const nocturnos = construirFilasNocturnas([aula, estacionamiento], 8, config);
  const guardia = nocturnos.filter((fila) => fila.servicio === "GUARDIA ESTACIONAMIENTO");
  assert.deepEqual(
    guardia.map((fila) => `${fila.turno} ${fila.nombres}`),
    ["1ER YANIS CALZADA", "2DO DARÍO FLORES", "3ER CESAR RIVAS"],
  );
  assert.equal(nocturnos.filter((fila) => fila.nombres === "AUSENTE").length, 0);
  assert.equal(
    nocturnos.filter((fila) => fila.servicio === "IMAGINARIA MASCULINO" && fila.nombres === "ANA RIVAS")
      .length,
    1,
  );

  const orden = buildOrdenDelDia({
    anio: 2026,
    mes: 10,
    dia: 9,
    planes: [aula, estacionamiento],
    nocturnoConfig: config,
  });
  assert.equal(orden.diurnos.some((fila) => fila.servicio.includes("ESTACIONAMIENTO")), false);
  assert.equal(orden.nocturnos.some((fila) => fila.servicio === "GUARDIA ESTACIONAMIENTO"), true);
  assert.equal(orden.fechaDocumento, "JUEVES 08 DE OCTUBRE DE 2026");
  assert.equal(orden.dia, 8);
  assert.match(orden.diurnosTitulo, /VIERNES 09 DE OCTUBRE DEL AÑO 2026/);
  assert.match(orden.nocturnosTitulo, /PARA HOY JUEVES 08 DE OCTUBRE DEL AÑO 2026/);
});
