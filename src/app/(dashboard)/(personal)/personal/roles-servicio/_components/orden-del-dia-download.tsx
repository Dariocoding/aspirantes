type FechaOrden = { anio: number; mes: number; dia: number };

export function ordenDelDiaPdfUrl({ anio, mes, dia }: FechaOrden): string {
  return `/api/roles-servicio/orden-del-dia/pdf?ambito=dia&anio=${anio}&mes=${mes}&dia=${dia}`;
}

export function ordenesDelMesPdfUrl(anio: number, mes: number): string {
  return `/api/roles-servicio/orden-del-dia/pdf?ambito=mes&anio=${anio}&mes=${mes}`;
}
