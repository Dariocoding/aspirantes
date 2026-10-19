import { unauthorized } from "next/navigation";
import {
  AutoridadesPanel,
  type AutoridadVista,
} from "../../roles-servicio/_components/autoridades-panel";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";

export default async function AutoridadesConfigPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();

  const canWrite = hasPermission(ctx, Permission.ASPIRANTES_WRITE);

  const autoridadesDb = await prisma.autoridad.findMany({
    orderBy: [{ jerarquia: "desc" }, { apellidos: "asc" }, { nombres: "asc" }],
    include: { _count: { select: { asignacionesRolServicio: true } } },
  });

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

  return <AutoridadesPanel autoridades={autoridades} canWrite={canWrite} />;
}
