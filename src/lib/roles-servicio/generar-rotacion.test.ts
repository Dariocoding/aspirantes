import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clavePersona,
  fusionarMarcas,
  generarCalendarioMultiRol,
  type PersonaClave,
} from "./generar-rotacion";

function persona(id: string, nombre: string, extra?: Partial<PersonaClave>): PersonaClave {
  return { asignacionId: id, nombre, ...extra };
}

test("un rol: una X por día y sin repetir persona hasta completar el ciclo", () => {
  const personas = [
    persona("a", "ANA"),
    persona("b", "BETO"),
    persona("c", "CARLA"),
    persona("d", "DARIO"),
    persona("e", "EVA"),
  ];
  const { porAsignacion, totalMarcas } = generarCalendarioMultiRol({
    roles: [{ clave: "insp", personas, cuposPorDia: 1 }],
    desdeDia: 1,
    hastaDia: 10,
    seed: 42,
  });

  assert.equal(totalMarcas, 10);

  const porDia = new Map<number, string[]>();
  for (const row of porAsignacion) {
    for (const m of row.dias) {
      const list = porDia.get(m.dia) ?? [];
      list.push(row.asignacionId);
      porDia.set(m.dia, list);
    }
  }
  for (let d = 1; d <= 10; d += 1) {
    assert.equal(porDia.get(d)?.length, 1, `día ${d} debe tener 1 marca`);
  }

  // Primer ciclo (días 1–5): 5 personas distintas.
  const primerCiclo = [1, 2, 3, 4, 5].map((d) => porDia.get(d)![0]!);
  assert.equal(new Set(primerCiclo).size, 5);
});

test("dos roles con persona compartida: nunca el mismo día", () => {
  const compartida = persona("shared", "LUIS", { aspiranteId: "asp-1" });
  const rolA = [
    compartida,
    persona("a2", "ANA"),
    persona("a3", "BETO"),
  ];
  const rolB = [
    { ...compartida, asignacionId: "shared-b" }, // misma persona, otra fila de rol
    persona("b2", "CARLA"),
    persona("b3", "DARIO"),
  ];

  assert.equal(clavePersona(rolA[0]!), clavePersona(rolB[0]!));

  const { porAsignacion } = generarCalendarioMultiRol({
    roles: [
      { clave: "rol-a", personas: rolA, cuposPorDia: 1 },
      { clave: "rol-b", personas: rolB, cuposPorDia: 1 },
    ],
    desdeDia: 1,
    hastaDia: 15,
    seed: 7,
  });

  const diasSharedA = new Set(
    (porAsignacion.find((x) => x.asignacionId === "shared")?.dias ?? []).map((d) => d.dia),
  );
  const diasSharedB = new Set(
    (porAsignacion.find((x) => x.asignacionId === "shared-b")?.dias ?? []).map((d) => d.dia),
  );
  for (const dia of diasSharedA) {
    assert.equal(diasSharedB.has(dia), false, `LUIS no puede servir el día ${dia} en ambos roles`);
  }
});

test("seed fijo produce el mismo resultado", () => {
  const personas = [
    persona("1", "A"),
    persona("2", "B"),
    persona("3", "C"),
    persona("4", "D"),
  ];
  const input = {
    roles: [{ clave: "r", personas, cuposPorDia: 1 }],
    desdeDia: 1,
    hastaDia: 8,
    seed: 12345,
  };
  const a = generarCalendarioMultiRol(input);
  const b = generarCalendarioMultiRol(input);
  assert.deepEqual(a.porAsignacion, b.porAsignacion);
  assert.equal(a.totalMarcas, b.totalMarcas);
});

test("seeds distintos pueden cambiar el orden", () => {
  const personas = [
    persona("1", "A"),
    persona("2", "B"),
    persona("3", "C"),
    persona("4", "D"),
    persona("5", "E"),
  ];
  const base = {
    roles: [{ clave: "r", personas, cuposPorDia: 1 as const }],
    desdeDia: 1,
    hastaDia: 5,
  };
  const a = generarCalendarioMultiRol({ ...base, seed: 1 });
  const b = generarCalendarioMultiRol({ ...base, seed: 99991 });
  // Quien sirve el día 1 puede diferir tras el baraje.
  const dia1A = a.porAsignacion.find((x) => x.dias.some((d) => d.dia === 1))?.asignacionId;
  const dia1B = b.porAsignacion.find((x) => x.dias.some((d) => d.dia === 1))?.asignacionId;
  assert.ok(dia1A && dia1B);
  // No exigimos desigualdad siempre (colisión posible), pero con estos seeds sí.
  assert.notEqual(dia1A, dia1B);
});

test("dias sueltos no marcan los huecos", () => {
  const personas = [persona("a", "ANA"), persona("b", "BETO"), persona("c", "CARLA")];
  const { porAsignacion, totalMarcas } = generarCalendarioMultiRol({
    roles: [{ clave: "insp", personas, cuposPorDia: 1 }],
    desdeDia: 1,
    hastaDia: 31,
    dias: [1, 2, 10],
    seed: 3,
  });
  assert.equal(totalMarcas, 3);
  const dias = porAsignacion.flatMap((row) => row.dias.map((item) => item.dia));
  assert.deepEqual(dias.sort((a, b) => a - b), [1, 2, 10]);
});

test("fusionarMarcas conserva los días que no se eligieron", () => {
  const out = fusionarMarcas({
    existentes: [
      { dia: 1, marca: "X" },
      { dia: 2, marca: "X" },
      { dia: 3, marca: "X" },
    ],
    nuevas: [{ dia: 1, marca: "T1" }, { dia: 3, marca: "T2" }],
    desdeDia: 1,
    hastaDia: 3,
    dias: [1, 3],
    reemplazarRango: true,
  });
  assert.deepEqual(out, [
    { dia: 1, marca: "T1" },
    { dia: 2, marca: "X" },
    { dia: 3, marca: "T2" },
  ]);
});

test("fusionarMarcas reemplaza solo el rango", () => {
  const out = fusionarMarcas({
    existentes: [
      { dia: 1, marca: "X" },
      { dia: 5, marca: "X" },
      { dia: 20, marca: "T1" },
    ],
    nuevas: [
      { dia: 5, marca: "T2" },
      { dia: 6, marca: "X" },
    ],
    desdeDia: 4,
    hastaDia: 10,
    reemplazarRango: true,
  });
  assert.deepEqual(out, [
    { dia: 1, marca: "X" },
    { dia: 5, marca: "T2" },
    { dia: 6, marca: "X" },
    { dia: 20, marca: "T1" },
  ]);
});
