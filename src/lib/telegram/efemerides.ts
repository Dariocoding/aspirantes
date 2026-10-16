import type { PrismaClient } from "@src/generated/prisma";
import { labelEfemerideTipo } from "@src/lib/efemeride-tipo";
import { siguienteDia } from "@src/lib/roles-servicio/orden-del-dia/fechas";
import { fechaEnCaracas, type FechaCaracas } from "@src/lib/telegram/load-orden-hoy";

export type EfemerideAvisoItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  dia: number;
  mes: number;
};

export type AvisoEfemerides = {
  offset: 0 | 1;
  etiqueta: string;
  fecha: FechaCaracas;
  items: EfemerideAvisoItem[];
};

function sumarDiasCaracas(base: FechaCaracas, delta: number): FechaCaracas {
  let cur = base;
  for (let i = 0; i < delta; i += 1) {
    const next = siguienteDia(cur.anio, cur.mes, cur.dia);
    if (!next) throw new Error("No se pudo avanzar la fecha");
    cur = next;
  }
  return cur;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Lee efemérides activas en vivo desde la BD (cualquier alta/edición se refleja
 * en la siguiente corrida del cron o envío manual).
 */
export async function cargarAvisosEfemerides(
  db: PrismaClient,
  hoy: FechaCaracas = fechaEnCaracas(),
): Promise<AvisoEfemerides[]> {
  const offsets: Array<{ offset: 0 | 1; etiqueta: string }> = [
    { offset: 0, etiqueta: "HOY" },
    { offset: 1, etiqueta: "MAÑANA" },
  ];

  const avisos: AvisoEfemerides[] = [];

  for (const { offset, etiqueta } of offsets) {
    const fecha = sumarDiasCaracas(hoy, offset);
    const rows = await db.efemeride.findMany({
      where: {
        activa: true,
        dia: fecha.dia,
        mes: fecha.mes,
      },
      orderBy: [{ tipo: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        tipo: true,
        dia: true,
        mes: true,
      },
    });

    avisos.push({
      offset,
      etiqueta,
      fecha,
      items: rows,
    });
  }

  return avisos;
}

/** Mensaje HTML; `null` si no hay efemérides hoy ni mañana. */
export function formatAvisosEfemerides(avisos: AvisoEfemerides[]): string | null {
  const conGente = avisos.filter((a) => a.items.length > 0);
  if (conGente.length === 0) return null;

  const lineas: string[] = [`<b>Efemérides</b>`, ""];

  for (const aviso of conGente) {
    const fechaTxt = `${String(aviso.fecha.dia).padStart(2, "0")}/${String(aviso.fecha.mes).padStart(2, "0")}/${aviso.fecha.anio}`;
    lineas.push(`<b>${escapeHtml(aviso.etiqueta)}</b> <i>(${fechaTxt})</i>`);
    for (const item of aviso.items) {
      const tipo = labelEfemerideTipo(item.tipo);
      lineas.push(`· <b>${escapeHtml(item.nombre)}</b> <i>(${escapeHtml(tipo)})</i>`);
      if (item.descripcion?.trim()) {
        lineas.push(`  ${escapeHtml(item.descripcion.trim())}`);
      }
    }
    lineas.push("");
  }

  if (conGente.some((a) => a.offset === 0)) {
    lineas.push("<i>Conmemoraciones de hoy.</i>");
  } else {
    lineas.push("<i>Aviso anticipado de efemérides.</i>");
  }

  return lineas.join("\n");
}
