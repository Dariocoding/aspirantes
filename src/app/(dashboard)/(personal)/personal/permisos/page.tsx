import { unauthorized } from "next/navigation";
import { PermisosView, type PermisoListItem } from "@dashboard/permisos/_components/permisos-view";
import type { PermisoAspiranteOption } from "@dashboard/permisos/_components/permiso-modals";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { prisma } from "@src/lib/prisma";
import type { PermisoTipoValue } from "@src/lib/permisos";

export default async function PermisosPage({
  searchParams,
}: {
  searchParams: Promise<{ aspiranteId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();

  const { aspiranteId } = await searchParams;
  const write = canWrite(ctx);
  const convocatoriaActiva = await getConvocatoriaActiva();

  const aspiranteWhere = convocatoriaActiva ? { convocatoriaId: convocatoriaActiva.id } : {};

  const [aspirantesDb, permisosDb] = await Promise.all([
    prisma.aspirante.findMany({
      where: aspiranteWhere,
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      select: { id: true, nombres: true, apellidos: true, cedula: true },
    }),
    prisma.permisoPersonal.findMany({
      where: convocatoriaActiva
        ? { aspirante: { convocatoriaId: convocatoriaActiva.id } }
        : {},
      orderBy: [{ fechaInicio: "desc" }],
      include: {
        aspirante: {
          select: { id: true, nombres: true, apellidos: true, cedula: true, fotoKey: true },
        },
      },
    }),
  ]);

  const aspirantes: PermisoAspiranteOption[] = aspirantesDb;
  const permisos: PermisoListItem[] = permisosDb.map((p) => ({
    id: p.id,
    aspiranteId: p.aspiranteId,
    tipo: p.tipo as PermisoTipoValue,
    fechaInicioIso: p.fechaInicio.toISOString(),
    fechaFinIso: p.fechaFin.toISOString(),
    motivo: p.motivo,
    destino: p.destino,
    autorizadoPor: p.autorizadoPor,
    observaciones: p.observaciones,
    anulado: p.anulado,
    nombres: p.aspirante.nombres,
    apellidos: p.aspirante.apellidos,
    cedula: p.aspirante.cedula,
    fotoKey: p.aspirante.fotoKey,
  }));

  return (
    <PermisosView
      canWrite={write}
      aspirantes={aspirantes}
      permisos={permisos}
      defaultAspiranteId={aspiranteId}
    />
  );
}
