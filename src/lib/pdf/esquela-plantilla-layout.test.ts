import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CUMPLEANOS_GOLD,
  CUMPLEANOS_LAYOUT,
} from "@src/lib/pdf/esquela-cumpleanos-layout";
import {
  DEFAULT_ESQUELA_PLANTILLA_LAYOUT,
  parseEsquelaPlantillaLayout,
} from "@src/lib/pdf/esquela-plantilla-layout";

test("el diseño por defecto reproduce las posiciones del afiche actual", () => {
  const { photo, name } = DEFAULT_ESQUELA_PLANTILLA_LAYOUT;
  assert.equal(photo.widthPct, CUMPLEANOS_LAYOUT.photoWidthPct);
  assert.equal(photo.heightPct, CUMPLEANOS_LAYOUT.photoHeightPct);
  assert.ok(Math.abs(photo.leftPct - (1 - CUMPLEANOS_LAYOUT.photoWidthPct) / 2) < 1e-12);
  assert.ok(
    Math.abs(photo.topPct + photo.heightPct / 2 - CUMPLEANOS_LAYOUT.photoCenterYPct) < 1e-12,
  );
  assert.equal(name.topPct, CUMPLEANOS_LAYOUT.nameTopPct);
  assert.equal(name.widthPct, CUMPLEANOS_LAYOUT.nameWidthPct);
  assert.equal(DEFAULT_ESQUELA_PLANTILLA_LAYOUT.gold.fill, CUMPLEANOS_GOLD.fill);
  assert.equal(DEFAULT_ESQUELA_PLANTILLA_LAYOUT.nameStyle, "goldScript");
  assert.equal(DEFAULT_ESQUELA_PLANTILLA_LAYOUT.overlayEnabled, true);
});

test("parseEsquelaPlantillaLayout completa huecos y recorta cajas fuera de rango", () => {
  const layout = parseEsquelaPlantillaLayout({
    photo: { leftPct: -1, topPct: 0.2, widthPct: 2, heightPct: 0.1 },
    overlayEnabled: false,
    nameStyle: "plain",
    gold: { fill: "#abc" },
  });
  assert.equal(layout.photo.leftPct, 0);
  assert.equal(layout.photo.widthPct, 1);
  assert.equal(layout.overlayEnabled, false);
  assert.equal(layout.nameStyle, "plain");
  assert.equal(layout.gold.fill, "#aabbcc");
  assert.equal(layout.name.topPct, DEFAULT_ESQUELA_PLANTILLA_LAYOUT.name.topPct);
});

test("JSON vacío o inválido cae al diseño ceremonial", () => {
  const a = parseEsquelaPlantillaLayout(null);
  const b = parseEsquelaPlantillaLayout("nope");
  assert.deepEqual(a, DEFAULT_ESQUELA_PLANTILLA_LAYOUT);
  assert.deepEqual(b, DEFAULT_ESQUELA_PLANTILLA_LAYOUT);
});
