import type { PrismaClient } from "@src/generated/prisma";
import { labelEfemerideTipo } from "@src/lib/efemeride-tipo";
import { siguienteDia } from "@src/lib/roles-servicio/orden-del-dia/fechas";
import {
  encabezadoInstitucional,
  escapeHtml,
  lineaSeccion,
  nroPad,
  pieMilitar,
} from "@src/lib/telegram/format-militar";
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

const ROMANOS = ["I", "II"] as const;

/** Mensaje HTML; `null` si no hay efemérides hoy ni mañana. */
export function formatAvisosEfemerides(avisos: AvisoEfemerides[]): string | null {
  const conItems = avisos.filter((a) => a.items.length > 0);
  if (conItems.length === 0) return null;

  const total = conItems.reduce((n, a) => n + a.items.length, 0);
  const lineas: string[] = [
    ...encabezadoInstitucional("EFEMÉRIDES INSTITUCIONALES"),
    `<b>CONMEMORACIONES:</b> ${total}`,
  ];

  conItems.forEach((aviso, i) => {
    const fechaTxt = `${String(aviso.fecha.dia).padStart(2, "0")}/${String(aviso.fecha.mes).padStart(2, "0")}/${aviso.fecha.anio}`;
    const tituloSeccion =
      aviso.offset === 0
        ? `Conmemoración de hoy (${fechaTxt})`
        : `Aviso — conmemoración mañana (${fechaTxt})`;

    lineas.push(...lineaSeccion(ROMANOS[i] ?? String(i + 1), tituloSeccion));

    let n = 1;
    for (const item of aviso.items) {
      const tipo = labelEfemerideTipo(item.tipo);
      lineas.push(
        `<b>${nroPad(n)}.</b> <b>${escapeHtml(item.nombre)}</b>`,
        `     <code>${escapeHtml(tipo)}</code>`,
      );
      if (item.descripcion?.trim()) {
        lineas.push(`     <i>${escapeHtml(item.descripcion.trim())}</i>`);
      }
      lineas.push("");
      n += 1;
    }
  });

  if (conItems.some((a) => a.offset === 0)) {
    lineas.push(
      ...pieMilitar(
        "Honrar la memoria y el legado que estas fechas representan para la institución.",
      ),
    );
  } else {
    lineas.push(
      ...pieMilitar("Aviso anticipado para preparar actos y menciones del día."),
    );
  }

  return lineas.join("\n");
}
