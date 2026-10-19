/** Utilidades de formato HTML estilo boleta / orden militar para Telegram. */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const SEP_GRUESA = "━━━━━━━━━━━━━━━━━━━━";
export const SEP_FINA = "────────────────────";

export function encabezadoInstitucional(subtitulo: string): string[] {
  return [
    SEP_GRUESA,
    "<b>CEFOA N.º 46</b>",
    `<b>${escapeHtml(subtitulo.toUpperCase())}</b>`,
    SEP_GRUESA,
  ];
}

export function lineaFecha(fecha: string): string {
  return `<b>FECHA:</b> ${escapeHtml(fecha)}`;
}

export function lineaSeccion(numero: string, titulo: string): string[] {
  return ["", `<b>${escapeHtml(numero)}. ${escapeHtml(titulo.toUpperCase())}</b>`, SEP_FINA];
}

export function pieMilitar(cierre?: string): string[] {
  return [
    "",
    SEP_GRUESA,
    `<i>${escapeHtml(cierre ?? "Disciplina, puntualidad y sentido del deber.")}</i>`,
    "",
    "<b>CÚMPLASE</b>",
  ];
}

export function nroPad(n: number): string {
  return String(n).padStart(2, "0");
}
