import { unauthorized } from "next/navigation";
import { RolesServicioShell } from "./_components/roles-servicio-shell";
import type { PlanVista } from "./_components/roles-servicio-view";
import type { AutoridadVista } from "./_components/autoridades-panel";
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

  const canWrite = hasPermission(ctx, Permission.ASPIRANTES_WRITE);
  const { rol } = await searchParams;
  const reciente = await prisma.planRolServicio.findFirst({
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
    select: { anio: true, mes: true },
  });

  const hoy = new Date();
  const diaHoy =
    reciente && hoy.getFullYear() === reciente.anio && hoy.getMonth() + 1 === reciente.mes
      ? hoy.getDate()
      : null;

  if (!reciente) {
    return (
      <RolesServicioShell
        anio={hoy.getFullYear()}
        mes={hoy.getMonth() + 1}
        planes={[]}
        rolInicial={null}
        diaHoy={null}
        autoridades={[]}
        canWrite={canWrite}
      />
    );
  }

  const [planesDb, autoridadesDb] = await Promise.all([
    prisma.planRolServicio.findMany({
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
            autoridad: {
              select: { id: true, nombres: true, apellidos: true, cedula: true, jerarquia: true },
            },
          },
        },
      },
    }),
    prisma.autoridad.findMany({
      orderBy: [{ jerarquia: "desc" }, { apellidos: "asc" }, { nombres: "asc" }],
      include: { _count: { select: { asignacionesRolServicio: true } } },
    }),
  ]);

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
      autoridad: asignacion.autoridad,
    })),
  }));

  const autoridades: AutoridadVista[] = autoridadesDb.map((item) => ({
    id: item.id,
    nombres: item.nombres,
    apellidos: item.apellidos,
    cedula: item.cedula,
    telefono: item.telefono,
    correo: item.correo,
    jerarquia: item.jerarquia,
    activa: item.activa,
    asignaciones: item._count.asignacionesRolServicio,
  }));

  const rolInicial = rol && planes.some((plan) => plan.clave === rol) ? rol : null;

  return (
    <RolesServicioShell
      anio={reciente.anio}
      mes={reciente.mes}
      planes={planes}
      rolInicial={rolInicial}
      diaHoy={diaHoy}
      autoridades={autoridades}
      canWrite={canWrite}
    />
  );
}
