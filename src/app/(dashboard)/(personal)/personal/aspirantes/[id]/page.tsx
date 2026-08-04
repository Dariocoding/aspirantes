import Link from "next/link";
import { Pencil, UserRound } from "lucide-react";
import { notFound, unauthorized } from "next/navigation";
import { AspiranteFichaTecnicaPdfLink } from "@dashboard/aspirantes/_components/aspirante-ficha-tecnica-pdf-link";
import { AspirantePerfilView } from "@dashboard/aspirantes/_components/aspirante-perfil-view";
import { buttonVariants } from "@src/components/ui/button";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { routes } from "@src/lib/apps/routes";
import { prisma } from "@src/lib/prisma";
import { cn } from "@src/lib/utils";

export default async function AspirantePerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) {
    unauthorized();
  }

  const { id } = await params;
  const a = await prisma.aspirante.findUnique({
    where: { id },
    include: {
      convocatoria: true,
      datosFisicos: true,
      contactos: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!a) notFound();

  const c = a.contactos[0];
  const write = canWrite(ctx);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <UserRound className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Perfil del aspirante</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AspiranteFichaTecnicaPdfLink aspiranteId={a.id} label="Descargar ficha técnica" />
          {write ? (
            <Link
              href={`${routes.personal.aspirantesGestion}?edit=${encodeURIComponent(a.id)}`}
              prefetch={false}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 border-slate-200 bg-white shadow-sm",
              )}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Editar
            </Link>
          ) : null}
          <Link
            href={routes.personal.aspirantes}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 border-slate-200 bg-white shadow-sm",
            )}
          >
            Volver al censo
          </Link>
        </div>
      </div>

      <AspirantePerfilView
        a={{
          id: a.id,
          nombres: a.nombres,
          apellidos: a.apellidos,
          cedula: a.cedula,
          edad: a.edad,
          sexo: a.sexo === "FEMENINO" ? "FEMENINO" : "MASCULINO",
          fechaNacimientoLabel: a.fechaNacimiento.toLocaleDateString("es-VE"),
          lugarNacimiento: a.lugarNacimiento,
          unidadPostulante: a.unidadPostulante,
          calificacionAdmision: a.calificacionAdmision,
          direccion: a.direccion,
          telefono: a.telefono,
          correo: a.correo,
          hijosCantidad: a.hijosCantidad,
          convocatoriaCodigo: a.convocatoria.codigo,
          convocatoriaNombre: a.convocatoria.nombre,
          convocatoriaAnio: a.convocatoria.anio,
          convocatoriaActiva: a.convocatoria.activa,
          estaturaCm: a.datosFisicos?.estaturaCm ?? null,
          pesoKg: a.datosFisicos?.pesoKg ?? null,
          tipoSangre: a.datosFisicos?.tipoSangre ?? null,
          alergias: a.datosFisicos?.alergias ?? null,
          condicionesMedicas: a.datosFisicos?.condicionesMedicas ?? null,
          discapacidad: a.datosFisicos?.discapacidad ?? null,
          observaciones: a.datosFisicos?.observaciones ?? null,
          contactoNombre: c?.nombre ?? null,
          contactoParentesco: c?.parentesco ?? null,
          contactoTelefono: c?.telefono ?? null,
          contactoDireccion: c?.direccion ?? null,
          fichaEvaluacion: a.fichaEvaluacion,
          fotoKey: a.fotoKey,
        }}
      />
    </div>
  );
}
