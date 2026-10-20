import type { PrismaClient } from "@src/generated/prisma";
import {
  buildOrdenDelDia,
  type OrdenDelDiaData,
  type PlanOrdenInput,
} from "@src/lib/roles-servicio/orden-del-dia/build-orden";
import {
  ORDEN_NOCTURNO_CONFIG_ID,
  defaultOrdenNocturnoConfig,
  normalizeOrdenNocturnoConfig,
} from "@src/lib/roles-servicio/orden-del-dia/config-nocturno";
import { siguienteDia } from "@src/lib/roles-servicio/orden-del-dia/fechas";
import { marcasDesdeJson } from "@src/lib/roles-servicio/marcas";

const ZONA = "America/Caracas";

export type FechaCaracas = {
  anio: number;
  mes: number;
  dia: number;
};

/** Fecha civil en Venezuela (sin DST). */
export function fechaEnCaracas(ahora = new Date()): FechaCaracas {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);

  const num = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value);

  return {
    anio: num("year"),
    mes: num("month"),
    dia: num("day"),
  };
}

export async function cargarPlanesOrden(
  db: PrismaClient,
  anio: number,
  mes: number,
): Promise<PlanOrdenInput[]> {
  const planesDb = await db.planRolServicio.findMany({
    where: { anio, mes },
    orderBy: { rol: { sortOrder: "asc" } },
    include: {
      rol: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        include: {
          aspirante: { select: { nombres: true, apellidos: true } },
          autoridad: { select: { nombres: true, apellidos: true, jerarquia: true } },
        },
      },
    },
  });

  return planesDb.map((plan) => ({
    clave: plan.rol.clave,
    nombre: plan.rol.nombre,
    curso: plan.rol.curso,
    turnoEnMarca: plan.rol.papelNocturno === "MARCA_TURNO",
    asignaciones: plan.asignaciones.map((asignacion) => ({
      orden: asignacion.orden,
      grado: asignacion.grado,
      nombre: asignacion.nombre,
      dias: marcasDesdeJson(asignacion.dias),
      aspirante: asignacion.aspirante,
      autoridad: asignacion.autoridad,
    })),
  }));
}

export type OrdenTelegramDia = {
  fecha: FechaCaracas;
  ordenDiurno: OrdenDelDiaData;
  /** Nocturnos de la noche de `fecha` (orden del día siguiente). */
  ordenNocturnoDelDia: OrdenDelDiaData;
};

/**
 * Carga la orden para el día civil en Caracas.
 * Diurnos = roles del día; nocturnos = guardia de esa misma noche.
 */
export async function loadOrdenTelegramDia(
  db: PrismaClient,
  fecha: FechaCaracas = fechaEnCaracas(),
): Promise<OrdenTelegramDia> {
  const { anio, mes, dia } = fecha;
  const manana = siguienteDia(anio, mes, dia);
  if (!manana) {
    throw new Error("No se pudo calcular el día siguiente");
  }

  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anioAnterior = mes === 1 ? anio - 1 : anio;
  const mismoMesManana = manana.anio === anio && manana.mes === mes;

  const [planes, planesMesAnterior, planesMesSiguiente, nocturnoRow, convocatoria, membrete] =
    await Promise.all([
      cargarPlanesOrden(db, anio, mes),
      cargarPlanesOrden(db, anioAnterior, mesAnterior),
      mismoMesManana
        ? Promise.resolve([] as PlanOrdenInput[])
        : cargarPlanesOrden(db, manana.anio, manana.mes),
      db.ordenNocturnoConfig.findUnique({ where: { id: ORDEN_NOCTURNO_CONFIG_ID } }),
      db.convocatoria.findFirst({ where: { activa: true } }),
      db.membrete.findFirst({
        where: { isDefault: true },
        orderBy: { nombre: "asc" },
      }),
    ]);

  if (planes.length === 0) {
    throw new Error(`No hay roles de servicio publicados para ${mes}/${anio}`);
  }

  const planesManana = mismoMesManana ? planes : planesMesSiguiente;
  if (planesManana.length === 0) {
    throw new Error(
      `No hay roles para calcular nocturnos del ${dia}/${mes}/${anio} (falta plan ${manana.mes}/${manana.anio})`,
    );
  }

  const nocturnoConfig = nocturnoRow
    ? normalizeOrdenNocturnoConfig(nocturnoRow.config)
    : defaultOrdenNocturnoConfig();

  const comunes = {
    lineasMembrete: membrete?.lineas,
    directorNombre: convocatoria?.comandanteNombre,
    nocturnoConfig,
  };

  const ordenDiurno = buildOrdenDelDia({
    anio,
    mes,
    dia,
    planes,
    planesMesAnterior,
    ...comunes,
  });

  const ordenNocturnoDelDia = buildOrdenDelDia({
    anio: manana.anio,
    mes: manana.mes,
    dia: manana.dia,
    planes: planesManana,
    planesMesAnterior: mismoMesManana ? planesMesAnterior : planes,
    ...comunes,
  });

  return { fecha, ordenDiurno, ordenNocturnoDelDia };
}
