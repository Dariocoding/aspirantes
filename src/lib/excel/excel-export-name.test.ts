import assert from "node:assert/strict";
import { test } from "node:test";
import {
  contentDispositionAttachment,
  excelAttachmentFilename,
  normalizeExcelTitle,
} from "./excel-export-name";

test("el título y el nombre del archivo se limpian para el Excel", () => {
  assert.equal(normalizeExcelTitle("  LISTADO\nDEL CURSO  "), "LISTADO DEL CURSO");
  assert.equal(normalizeExcelTitle("   "), "");
  assert.equal(excelAttachmentFilename("Listado curso 46.xlsx", "censo"), "Listado curso 46.xlsx");
  assert.equal(excelAttachmentFilename("a/b:c", "censo-aspirantes"), "a b c.xlsx");
  assert.equal(excelAttachmentFilename("   ", "censo-aspirantes-N46-2026-10-08"), "censo-aspirantes-N46-2026-10-08.xlsx");
  const header = contentDispositionAttachment("Censo Ñandú.xlsx");
  assert.match(header, /filename="Censo Nandu.xlsx"/);
  assert.match(header, /filename\*=UTF-8''Censo%20%C3%91and%C3%BA\.xlsx/);
});
