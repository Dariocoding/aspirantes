import { unauthorized } from "next/navigation";
import { RolesServicioView, type PlanVista } from "./_components/roles-servicio-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { marcasDesdeJson } from "@src/lib/roles-servicio/marcas";
import { prisma } from "@src/lib/prisma";

export default async function RolesServicioPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();

  const { rol } = await searchParams;
  const reciente = await prisma.planRolServicio.findFirst({
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
    select: { anio: true, mes: true },
  });

  if (!reciente) {
    return (
      <RolesServicioView anio={new Date().getFullYear()} mes={new Date().getMonth() + 1} planes={[]} activo={null} diaHoy={null} />
    );
  }

  const planesDb = await prisma.planRolServicio.findMany({
    where: { anio: reciente.anio, mes: reciente.mes },
    orderBy: { rol: { sortOrder: "asc" } },
    include: {
      rol: true,
      asignaciones: {
        orderBy: { orden: "asc" },
        include: {
          aspirante: {
            select: { id: true, nombres: true, apellidos: true, cedula: true },
          },
        },
      },
    },
  });

  const planes: PlanVista[] = planesDb.map((plan) => ({
    clave: plan.rol.clave,
    nombre: plan.rol.nombre,
    curso: plan.rol.curso,
    asignaciones: plan.asignaciones.map((asignacion) => ({
      id: asignacion.id,
      orden: asignacion.orden,
      grado: asignacion.grado,
      nombre: asignacion.nombre,
      dias: marcasDesdeJson(asignacion.dias),
      aspirante: asignacion.aspirante,
    })),
  }));

  const activo = planes.find((plan) => plan.clave === rol) ?? planes[0] ?? null;
  const hoy = new Date();
  const diaHoy =
    hoy.getFullYear() === reciente.anio && hoy.getMonth() + 1 === reciente.mes ? hoy.getDate() : null;

  return (
    <RolesServicioView
      anio={reciente.anio}
      mes={reciente.mes}
      planes={planes}
      activo={activo}
      diaHoy={diaHoy}
    />
  );
}
