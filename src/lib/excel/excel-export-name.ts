const MAX_TITLE = 180;
const MAX_FILE = 80;

/** Título visible dentro de la hoja. Vacío si no hay texto útil. */
export function normalizeExcelTitle(raw: string | null | undefined): string {
  return (raw ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TITLE);
}

/** Nombre de descarga .xlsx. Si el texto no sirve, usa el respaldo. */
export function excelAttachmentFilename(raw: string | null | undefined, fallback: string): string {
  const cleaned = (raw ?? "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.xlsx$/i, "")
    .slice(0, MAX_FILE)
    .trim()
    .replace(/[. ]+$/g, "");
  const base = cleaned || fallback.replace(/\.xlsx$/i, "").trim() || "censo-aspirantes";
  return `${base}.xlsx`;
}

export function contentDispositionAttachment(filename: string): string {
  const ascii = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
