import type { PrismaClient } from "@src/generated/prisma";
import { ageFromBirthDate, hasRealBirthDate } from "@src/lib/date";
import { fechaEnCaracas, type FechaCaracas } from "@src/lib/telegram/load-orden-hoy";
import { siguienteDia } from "@src/lib/roles-servicio/orden-del-dia/fechas";

export type CumpleanoPersona = {
  id: string;
  nombres: string;
  apellidos: string;
  grado: string;
  fechaNacimiento: Date;
  edadQueCumple: number | null;
};

export type AvisoCumpleanos = {
  offset: 0 | 1 | 2;
  etiqueta: string;
  fecha: FechaCaracas;
  personas: CumpleanoPersona[];
};

function mesDiaEnCaracas(date: Date): { mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const num = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value);
  return { mes: num("month"), dia: num("day") };
}

function etiquetaGrado(jerarquia: string): string {
  if (jerarquia === "ASPIRANTE_OFICIAL") return "ASP/OFIC";
  if (jerarquia === "DISTINGUIDO") return "DISTINGUIDO";
  return jerarquia;
}

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
 * Lee fechas de nacimiento en vivo desde la BD. Si se corrige el nacimiento
 * de un aspirante, la siguiente corrida del cron/envío manual ya usa el dato nuevo.
 */
export async function cargarAvisosCumpleanos(
  db: PrismaClient,
  hoy: FechaCaracas = fechaEnCaracas(),
): Promise<AvisoCumpleanos[]> {
  const aspirantes = await db.aspirante.findMany({
    where: { deletedAt: null },

    select: {
      id: true,
      nombres: true,
      apellidos: true,
      jerarquia: true,
      fechaNacimiento: true,
    },
  });

  const offsets: Array<{ offset: 0 | 1 | 2; etiqueta: string }> = [
    { offset: 0, etiqueta: "HOY — ¡Felicitaciones!" },
    { offset: 1, etiqueta: "MAÑANA" },
    { offset: 2, etiqueta: "EN 2 DÍAS" },
  ];

  const avisos: AvisoCumpleanos[] = [];

  for (const { offset, etiqueta } of offsets) {
    const fecha = sumarDiasCaracas(hoy, offset);
    const personas: CumpleanoPersona[] = [];

    for (const a of aspirantes) {
      if (!hasRealBirthDate(a.fechaNacimiento)) continue;
      const md = mesDiaEnCaracas(a.fechaNacimiento);
      if (md.mes !== fecha.mes || md.dia !== fecha.dia) continue;

      // Edad que cumple ese día (año de la fecha del aviso).
      const ref = new Date(fecha.anio, fecha.mes - 1, fecha.dia, 12, 0, 0, 0);
      const edad = ageFromBirthDate(a.fechaNacimiento, ref);

      personas.push({
        id: a.id,
        nombres: a.nombres,
        apellidos: a.apellidos,
        grado: etiquetaGrado(a.jerarquia),
        fechaNacimiento: a.fechaNacimiento,
        edadQueCumple: edad,
      });
    }

    personas.sort((x, y) =>
      `${x.apellidos} ${x.nombres}`.localeCompare(`${y.apellidos} ${y.nombres}`, "es"),
    );

    avisos.push({ offset, etiqueta, fecha, personas });
  }

  return avisos;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Mensaje HTML; `null` si no hay nadie en los tres avisos. */
export function formatAvisosCumpleanos(avisos: AvisoCumpleanos[]): string | null {
  const conGente = avisos.filter((a) => a.personas.length > 0);
  if (conGente.length === 0) return null;

  const lineas: string[] = [`<b>Cumpleaños</b>`, ""];

  for (const aviso of conGente) {
    const fechaTxt = `${String(aviso.fecha.dia).padStart(2, "0")}/${String(aviso.fecha.mes).padStart(2, "0")}/${aviso.fecha.anio}`;
    lineas.push(`<b>${escapeHtml(aviso.etiqueta)}</b> <i>(${fechaTxt})</i>`);
    for (const p of aviso.personas) {
      const nombre = `${p.nombres} ${p.apellidos}`.trim().toUpperCase();
      const edad =
        p.edadQueCumple != null ? ` — cumple ${p.edadQueCumple} años` : "";
      const felicitacion = aviso.offset === 0 ? " 🎉" : "";
      lineas.push(
        `· ${escapeHtml(p.grado)} <b>${escapeHtml(nombre)}</b>${escapeHtml(edad)}${felicitacion}`,
      );
    }
    lineas.push("");
  }

  if (conGente.some((a) => a.offset === 0)) {
    lineas.push("<i>¡Felicitaciones a quienes cumplen años hoy!</i>");
  } else {
    lineas.push("<i>Avisos anticipados de cumpleaños.</i>");
  }

  return lineas.join("\n");
}
