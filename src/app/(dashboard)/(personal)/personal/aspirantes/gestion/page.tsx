import Link from "next/link";
import { ClipboardList, UserPlus } from "lucide-react";
import { AspiranteRegistroForm } from "@dashboard/aspirantes/_components/aspirante-forms";
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
  if (editId) redirect(routes.personal.aspirante(editId));

  const totalConvocatorias = await prisma.convocatoria.count();
  if (totalConvocatorias === 0) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <UserPlus className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Registro de aspirantes</h1>
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

  const pelotones = convocatoriaActiva
    ? await prisma.peloton.findMany({
        where: { convocatoriaId: convocatoriaActiva.id },
        orderBy: { numero: "asc" },
        select: { id: true, numero: true, nombre: true },
      })
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <UserPlus className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Registro de aspirantes</h1>
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

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-sm">
              <ClipboardList className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 gap-y-1">
                <CardTitle className="text-base font-semibold text-slate-900">Registrar aspirante</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600">
                Puede registrar con nombres, apellidos y cédula; el resto de datos es opcional y se puede completar después.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <AspiranteRegistroForm
            canWrite
            convocatoriaActiva={convocatoriaResumen}
            pelotones={pelotones}
          />
        </CardContent>
      </Card>
    </div>
  );
}
