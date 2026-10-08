import assert from "node:assert/strict";
import { test } from "node:test";
import { pickFotoForFichaTecnica } from "@src/lib/storage/aspirante-foto";

test("la ficha técnica usa su foto y, si no hay, la de carnet", () => {
  assert.equal(pickFotoForFichaTecnica("aspirantes/1/ficha-tecnica.jpg", "aspirantes/1/foto.webp"), "aspirantes/1/ficha-tecnica.jpg");
  assert.equal(pickFotoForFichaTecnica(null, "aspirantes/1/foto.webp"), "aspirantes/1/foto.webp");
  assert.equal(pickFotoForFichaTecnica("  ", "aspirantes/1/foto.jpg"), "aspirantes/1/foto.jpg");
  assert.equal(pickFotoForFichaTecnica(null, null), null);
});
