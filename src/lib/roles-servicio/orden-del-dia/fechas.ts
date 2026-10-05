const DIAS_SEMANA = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
] as const;

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
] as const;

/** Día y mes, sin año: MIÉRCOLES 02 DE SEPTIEMBRE */
export function etiquetaDiaMesOrden(anio: number, mes: number, dia: number): string {
  const fecha = new Date(anio, mes - 1, dia);
  const semana = DIAS_SEMANA[fecha.getDay()] ?? "";
  const mesNombre = MESES[mes - 1] ?? "";
  const diaPad = String(dia).padStart(2, "0");
  return `${semana} ${diaPad} DE ${mesNombre}`;
}

/** Etiqueta larga: MIÉRCOLES 02 DE SEPTIEMBRE DE 2026 */
export function etiquetaFechaOrden(anio: number, mes: number, dia: number): string {
  return `${etiquetaDiaMesOrden(anio, mes, dia)} DE ${anio}`;
}

/** Día del año (1–366), usado como Número de Orden del día. */
export function numeroOrdenDelDia(anio: number, mes: number, dia: number): number {
  const inicio = Date.UTC(anio, 0, 0);
  const actual = Date.UTC(anio, mes - 1, dia);
  return Math.round((actual - inicio) / 86_400_000);
}

/** Efemérides institucionales del encabezado (convención documental CEFOA).
 * No son números fijos: se calculan con el año del documento.
 * - Independencia: desde el 19 Abr 1810
 * - Federación: desde el 20 Feb 1859 (Grito de Coro / Guerra Federal)
 * - Revolución: desde el 2 Feb 1999 (inicio de la Revolución Bolivariana)
 * Ej. 2026 → 216º / 167º / 27º.
 */
export function aniversariosInstitucionales(anio: number): {
  independencia: number;
  federacion: number;
  revolucion: number;
} {
  return {
    independencia: anio - 1810,
    federacion: anio - 1859,
    revolucion: anio - 1999,
  };
}

/** Día calendario anterior. El nocturno de la orden es el de esta fecha. */
export function diaAnterior(
  anio: number,
  mes: number,
  dia: number,
): { anio: number; mes: number; dia: number } {
  const fecha = new Date(anio, mes - 1, dia - 1);
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    dia: fecha.getDate(),
  };
}

export function siguienteDia(
  anio: number,
  mes: number,
  dia: number,
): { anio: number; mes: number; dia: number } | null {
  const fecha = new Date(anio, mes - 1, dia + 1);
  if (Number.isNaN(fecha.getTime())) return null;
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    dia: fecha.getDate(),
  };
}
