import { OrdenDelDiaPdfDocument } from "@src/lib/pdf/orden-del-dia-document";
import type { OrdenDelDiaData } from "@src/lib/roles-servicio/orden-del-dia/build-orden";

/** Alias estable para la API de PDF (un día o todo el mes). */
export function OrdenDelDiaPdfFile(props: {
  ordenes: OrdenDelDiaData[];
  logoIzq: string | null;
  logoDer: string | null;
  titulo?: string;
}) {
  return <OrdenDelDiaPdfDocument {...props} />;
}
