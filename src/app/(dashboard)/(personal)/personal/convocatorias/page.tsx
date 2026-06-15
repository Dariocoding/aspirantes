import { ConvocatoriasView } from "@dashboard/convocatorias/_components/convocatorias-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { redirect, unauthorized } from "next/navigation";
import { prisma } from "@src/lib/prisma";

export default async function ConvocatoriasPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  if (!hasPermission(authContextFromSession(session), Permission.CONVOCATORIAS_MANAGE)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const rows = await prisma.convocatoria.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      codigo: true,
      nombre: true,
      anio: true,
      activa: true,
      _count: { select: { aspirantes: true } },
    },
  });

  const convocatorias = rows.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    nombre: r.nombre,
    anio: r.anio,
    activa: r.activa,
    aspirantesCount: r._count.aspirantes,
  }));

  return <ConvocatoriasView convocatorias={convocatorias} />;
}
