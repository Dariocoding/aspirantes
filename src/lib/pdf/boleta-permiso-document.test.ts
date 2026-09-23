import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { BoletasPermisoPdfDocument } from "@src/lib/pdf/boleta-permiso-document";

const convocatoria = {
  nombre: "Curso 45",
  codigo: "CEFOA-45",
  anio: 2026,
  cursoNro: "45",
  directorNombre: "CNEL. PRUEBA",
  directorCargo: "DIRECTOR DEL C.E.F.O.A. 45",
  headerLines: [
    "República Bolivariana de Venezuela",
    "Ministerio del Poder Popular para la Defensa",
    "Ejército Bolivariano",
    "Dirección de Educación del Ejército",
    "Curso 45",
  ],
};

function card(id: string, serial: string, nombres: string, apellidos: string, cedula: string) {
  return {
    id,
    serial,
    nombres,
    apellidos,
    cedula,
    cabello: "NEGRO",
    grupoSanguineo: "ORH+",
    ojos: "CAFÉ",
    colorPiel: "BLANCA",
    direccion: "Calle 1",
    telefono: "0412-0000000",
    emergenciaDireccion: "Calle 2",
    emergenciaTelefono: "0416-1111111",
    foto: null,
  };
}

test("la boleta se genera como PDF, dos aspirantes por hoja", async () => {
  const doc = createElement(BoletasPermisoPdfDocument, {
    convocatoria,
    cards: [
      card("a1", "001", "ANA", "PEREZ", "123"),
      card("a2", "002", "LUIS", "DIAZ", "456"),
    ],
    logoCefoa: null,
    logoEjercito: null,
    bandera: null,
  });
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);
  assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
  assert.ok(buffer.length > 1000);
});

test("la boleta incrusta la franja de la Bandera Nacional en el anverso", async () => {
  const bandera = readFileSync(join(process.cwd(), "public", "images", "bandera-de-venezuela.jpg"));
  const without = await renderToBuffer(
    createElement(BoletasPermisoPdfDocument, {
      convocatoria,
      cards: [card("a1", "001", "ANA", "PEREZ", "123")],
      logoCefoa: null,
      logoEjercito: null,
      bandera: null,
    }) as Parameters<typeof renderToBuffer>[0],
  );
  const withFlag = await renderToBuffer(
    createElement(BoletasPermisoPdfDocument, {
      convocatoria,
      cards: [card("a1", "001", "ANA", "PEREZ", "123")],
      logoCefoa: null,
      logoEjercito: null,
      bandera,
    }) as Parameters<typeof renderToBuffer>[0],
  );
  assert.equal(withFlag.subarray(0, 4).toString(), "%PDF");
  assert.ok(withFlag.length > without.length);
});
