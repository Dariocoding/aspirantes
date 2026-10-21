import { unauthorized } from "next/navigation";
import { RolesServicioShell } from "./_components/roles-servicio-shell";
import type { PlanVista } from "./_components/roles-servicio-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import { esRolConTurnoEnMarca } from "@src/lib/roles-servicio/turnos-marca";
import { prisma } from "@src/lib/prisma";

export default async function RolesServicioPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; anio?: string; mes?: string }>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();

  const canWrite = hasPermission(ctx, Permission.ASPIRANTES_WRITE);
  const { rol, anio: anioRaw, mes: mesRaw } = await searchParams;

  const hoy = new Date();
  const anioPedido = Number(anioRaw);
  const mesPedido = Number(mesRaw);
  const pedidoValido =
    Number.isInteger(anioPedido) &&
    anioPedido >= 2000 &&
    anioPedido <= 2100 &&
    Number.isInteger(mesPedido) &&
    mesPedido >= 1 &&
    mesPedido <= 12;
  const anio = pedidoValido ? anioPedido : hoy.getFullYear();
  const mes = pedidoValido ? mesPedido : hoy.getMonth() + 1;
  const diaHoy = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes ? hoy.getDate() : null;

  const planesDb = await prisma.planRolServicio.findMany({
    where: { anio, mes },
    orderBy: { rol: { sortOrder: "asc" } },
    include: {
      rol: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        include: {
          aspirante: {
            select: { id: true, nombres: true, apellidos: true, cedula: true, fotoKey: true },
          },
          autoridad: {
            select: { id: true, nombres: true, apellidos: true, cedula: true, jerarquia: true },
          },
        },
      },
    },
  });

  const planes: PlanVista[] = planesDb.map((plan) => ({
    clave: plan.rol.clave,
    nombre: plan.nombre,
    curso: plan.rol.curso,
    turnoEnMarca:
      plan.papelNocturno === "MARCA_TURNO" || esRolConTurnoEnMarca(plan.nombre),
    asignaciones: plan.asignaciones.map((asignacion) => ({
      id: asignacion.id,
      orden: asignacion.orden,
      grado: asignacion.grado,
      nombre: asignacion.nombre,
      dias: marcasDesdeJson(asignacion.dias),
      aspirante: asignacion.aspirante,
      autoridad: asignacion.autoridad,
    })),
  }));

  const rolInicial = rol && planes.some((plan) => plan.clave === rol) ? rol : null;

  return (
    <RolesServicioShell
      anio={anio}
      mes={mes}
      planes={planes}
      rolInicial={rolInicial}
      diaHoy={diaHoy}
      canWrite={canWrite}
      sellado={planesDb.length > 0 && planesDb.every((plan) => plan.sellado)}
    />
  );
}
