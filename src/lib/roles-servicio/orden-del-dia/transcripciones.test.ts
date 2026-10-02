import { describe, expect, it } from "vitest";
import {
  listTranscripciones,
  trioTranscripcionesDelDia,
  transcripcionDelDia,
} from "./transcripciones";
import { numeroOrdenDelDia } from "./fechas";

describe("transcripciones orden del día", () => {
  it("tiene al menos 31 entradas por categoría", () => {
    expect(listTranscripciones("libertador").length).toBeGreaterThanOrEqual(31);
    expect(listTranscripciones("comandante").length).toBeGreaterThanOrEqual(31);
    expect(listTranscripciones("ley_disciplina").length).toBeGreaterThanOrEqual(31);
  });

  it("no repite la misma transcripción en los 31 días de un mes", () => {
    const anio = 2026;
    const mes = 10;
    for (const categoria of ["libertador", "comandante", "ley_disciplina"] as const) {
      const ids = Array.from({ length: 31 }, (_, i) =>
        transcripcionDelDia(categoria, anio, mes, i + 1).id,
      );
      expect(new Set(ids).size).toBe(31);
    }
  });

  it("cambia la permutación entre meses", () => {
    const a = trioTranscripcionesDelDia(2026, 9, 1).libertador.id;
    const b = trioTranscripcionesDelDia(2026, 10, 1).libertador.id;
    expect(a).not.toBe(b);
  });
});

describe("numeroOrdenDelDia", () => {
  it("coincide con el día del año (1 sep no bisiesto = 244)", () => {
    expect(numeroOrdenDelDia(2026, 9, 1)).toBe(244);
  });
});
