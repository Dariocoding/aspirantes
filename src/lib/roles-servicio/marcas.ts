export type MarcaDia = {
  dia: number;
  marca: string;
};

export function marcasDesdeJson(value: unknown): MarcaDia[] {
  if (!Array.isArray(value)) return [];
  const marcas: MarcaDia[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const dia = Number((item as { dia?: unknown }).dia);
    const marca = String((item as { marca?: unknown }).marca ?? "")
      .trim()
      .toUpperCase();
    if (!Number.isInteger(dia) || dia < 1 || dia > 31 || !marca) continue;
    marcas.push({ dia, marca });
  }
  return marcas.sort((a, b) => a.dia - b.dia);
}

export function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

const NOMBRES_MES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export function etiquetaMes(anio: number, mes: number): string {
  const nombre = NOMBRES_MES[mes - 1] ?? String(mes);
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

const LETRA_SEMANA = ["D", "L", "M", "M", "J", "V", "S"] as const;

export function letraSemana(anio: number, mes: number, dia: number): string {
  return LETRA_SEMANA[new Date(anio, mes - 1, dia).getDay()] ?? "";
}

export function esFinDeSemana(anio: number, mes: number, dia: number): boolean {
  const semana = new Date(anio, mes - 1, dia).getDay();
  return semana === 0 || semana === 6;
}
