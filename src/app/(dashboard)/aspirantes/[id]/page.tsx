import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AspirantePerfilView, type AspirantePerfilSerializado } from "@/components/aspirantes/aspirante-perfil-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { canWrite } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { notFound, unauthorized } from "next/navigation";

export default async function AspirantePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) unauthorized();

  const { id } = await params;
  const aspiranteId = id?.trim();
  if (!aspiranteId) notFound();

  const a = await prisma.aspirante.findUnique({
    where: { id: aspiranteId },
    include: {
      datosFisicos: true,
      contactos: { orderBy: { createdAt: "asc" }, take: 1 },
      convocatoria: true,
    },
  });

  if (!a) notFound();

  const c = a.contactos[0];
  const write = canWrite(session.user.role);

  const serializado: AspirantePerfilSerializado = {
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
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href="/aspirantes"
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 shrink-0 gap-1 border-slate-200 bg-white shadow-sm",
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Censo
          </Link>
          <h1 className="min-w-0 text-xl font-semibold tracking-tight text-slate-900">Ficha del aspirante</h1>
        </div>
        {write ? (
          <Link
            href={`/aspirantes/gestion?edit=${encodeURIComponent(a.id)}`}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-9 bg-slate-900 shadow-sm hover:bg-slate-800",
            )}
          >
            Editar registro
          </Link>
        ) : null}
      </div>

      <AspirantePerfilView a={serializado} />
    </div>
  );
}
