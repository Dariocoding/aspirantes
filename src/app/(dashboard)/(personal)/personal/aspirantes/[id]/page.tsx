import Link from "next/link";
import { ClipboardList, UserRound, UserPlus } from "lucide-react";
import { AspiranteRegistroForm, type AspiranteRegistroInitial } from "@dashboard/aspirantes/_components/aspirante-forms";
import { SinConvocatoriasPanel } from "@dashboard/aspirantes/_components/sin-convocatorias-panel";
import { buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { cn } from "@src/lib/utils";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { routes } from "@src/lib/apps/routes";
import { redirect, unauthorized } from "next/navigation";
import { getConvocatoriaActiva } from "@src/lib/convocatoria";
import { toDateInputValue } from "@src/lib/date-input";
import { prisma } from "@src/lib/prisma";

export default async function AspirantesGestionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!canWrite(ctx)) redirect("/sin-permiso?motivo=escritura");
  const showConvocatoriasLink = hasPermission(ctx, Permission.CONVOCATORIAS_MANAGE);

  const spRaw = await searchParams;
  const editParam = spRaw.edit;
  const editId = typeof editParam === "string" ? editParam.trim() : "";

  const totalConvocatorias = await prisma.convocatoria.count();
  if (totalConvocatorias === 0) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <UserPlus className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Registro y actualización</h1>
          </div>
          <Link
            href={routes.personal.aspirantes}
            prefetch={false}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 w-fit border-slate-200 bg-white shadow-sm",
            )}
          >
            Volver al censo
          </Link>
        </div>
        <SinConvocatoriasPanel showConvocatoriasLink={showConvocatoriasLink} context="gestion" />
      </div>
    );
  }

  const convocatoriaActiva = await getConvocatoriaActiva();
  const convocatoriaResumen = convocatoriaActiva
    ? { codigo: convocatoriaActiva.codigo, nombre: convocatoriaActiva.nombre }
    : null;

  let registroInitial: AspiranteRegistroInitial | null = null;
  if (editId && convocatoriaActiva) {
    const a = await prisma.aspirante.findFirst({
      where: { id: editId, convocatoriaId: convocatoriaActiva.id },
      include: {
        datosFisicos: true,
        contactos: { orderBy: { createdAt: "asc" }, take: 1 },
      },
    });
    if (a) {
      const c = a.contactos[0];
      registroInitial = {
        id: a.id,
        unidadPostulante: a.unidadPostulante,
        calificacionAdmision: a.calificacionAdmision,
        nombres: a.nombres,
        apellidos: a.apellidos,
        cedula: a.cedula,
        edad: a.edad,
        sexo: a.sexo === "FEMENINO" ? "FEMENINO" : "MASCULINO",
        fechaNacimiento: toDateInputValue(a.fechaNacimiento),
        lugarNacimiento: a.lugarNacimiento,
        direccion: a.direccion,
        telefono: a.telefono,
        correo: a.correo,
        hijosCantidad: a.hijosCantidad,
        estaturaCm: a.datosFisicos?.estaturaCm ?? null,
        pesoKg: a.datosFisicos?.pesoKg ?? null,
        tipoSangre: a.datosFisicos?.tipoSangre ?? null,
        alergias: a.datosFisicos?.alergias ?? null,
        condicionesMedicas: a.datosFisicos?.condicionesMedicas ?? null,
        discapacidad: a.datosFisicos?.discapacidad ?? null,
        observaciones: a.datosFisicos?.observaciones ?? null,
        contactoNombre: c?.nombre ?? "",
        contactoParentesco: c?.parentesco ?? "",
        contactoTelefono: c?.telefono ?? "",
        contactoDireccion: c?.direccion ?? null,
        fichaEvaluacion: a.fichaEvaluacion,
      };
    }
  }

  const modoEdicion = Boolean(registroInitial);
  const tituloCard = modoEdicion ? "Editar aspirante" : "Registrar aspirante";
  const descCard = modoEdicion
    ? "Mismos pasos que el alta: revise cada sección y guarde los cambios."
    : "Alta por pasos: identidad, contacto, salud y persona de emergencia.";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <UserPlus className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Registro y actualización de aspirantes</h1>
        </div>
        <Link
          href={routes.personal.aspirantes}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 w-fit border-slate-200 bg-white shadow-sm",
          )}
        >
          Volver al censo
        </Link>
      </div>

      {editId && !registroInitial ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No se encontró el aspirante en la convocatoria activa.{" "}
          <Link href={routes.personal.aspirantesGestion} className="font-medium text-amber-950 underline underline-offset-2">
            Volver al registro nuevo
          </Link>
        </p>
      ) : null}

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <ClipboardList className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 gap-y-1">
                <CardTitle className="text-base font-semibold text-slate-900">{tituloCard}</CardTitle>
                {modoEdicion ? (
                  <>
                    <Link
                      href={routes.personal.aspirante(registroInitial!.id)}
                      prefetch={false}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-7 gap-1 border-slate-200 bg-white text-xs shadow-sm",
                      )}
                    >
                      <UserRound className="h-3.5 w-3.5" aria-hidden />
                      Ver ficha
                    </Link>
                    <Link
                      href={routes.personal.aspirantesGestion}
                      prefetch={false}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-7 border-slate-200 bg-white text-xs shadow-sm",
                      )}
                    >
                      Nuevo registro
                    </Link>
                  </>
                ) : null}
              </div>
              <CardDescription className="text-xs text-slate-600">{descCard}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <AspiranteRegistroForm canWrite convocatoriaActiva={convocatoriaResumen} initial={registroInitial} />
        </CardContent>
      </Card>
    </div>
  );
}
