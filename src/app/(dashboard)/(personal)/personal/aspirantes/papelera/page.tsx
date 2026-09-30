import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Trash2 } from "lucide-react";
import { redirect, unauthorized } from "next/navigation";
import { PapeleraRowActions } from "@dashboard/aspirantes/_components/papelera-row-actions";
import { buttonVariants } from "@src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/components/ui/card";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { canWrite } from "@src/lib/auth/roles";
import { routes } from "@src/lib/apps/routes";
import { prisma } from "@src/lib/prisma";
import { cn } from "@src/lib/utils";

export default async function PapeleraPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  const ctx = authContextFromSession(session);
  if (!hasPermission(ctx, Permission.ASPIRANTES_READ)) unauthorized();
  if (!canWrite(ctx)) redirect(routes.personal.aspirantes);

  const rows = await prisma.aspirante.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      cedula: true,
      deletedAt: true,
      deletedByEmail: true,
      convocatoria: { select: { nombre: true, anio: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Trash2 className="h-5 w-5 shrink-0 text-slate-800" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Papelera</h1>
            <p className="text-sm text-slate-600">
              Aspirantes que ya no aparecen en el censo. Puede ver su perfil, restaurarlos o eliminarlos por completo.
            </p>
          </div>
        </div>
        <Link
          href={routes.personal.aspirantes}
          prefetch={false}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 gap-1.5 border-slate-200 bg-white shadow-sm",
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver al censo
        </Link>
      </div>

      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <CardHeader className="border-b border-slate-200/80 bg-linear-to-br from-slate-50 to-white py-3">
          <CardTitle className="text-base font-semibold text-slate-900">Eliminados del censo</CardTitle>
          <CardDescription className="text-xs text-slate-600">
            {rows.length === 0
              ? "La papelera está vacía."
              : `${rows.length} registro${rows.length === 1 ? "" : "s"} en espera.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">
              Cuando elimine a alguien del censo, aparecerá aquí hasta que lo restaure o lo borre por completo.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Aspirante</th>
                    <th className="px-4 py-2.5 font-medium">Cédula</th>
                    <th className="px-4 py-2.5 font-medium">Convocatoria</th>
                    <th className="px-4 py-2.5 font-medium">Eliminado</th>
                    <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const nombre = `${row.nombres} ${row.apellidos}`.trim();
                    return (
                      <tr key={row.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <Link
                            href={routes.personal.aspirante(row.id)}
                            prefetch={false}
                            className="underline-offset-2 hover:underline"
                          >
                            {nombre}
                          </Link>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{row.cedula}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.convocatoria.nombre}
                          {" · "}
                          {row.convocatoria.anio}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>
                            {row.deletedAt
                              ? format(row.deletedAt, "d MMM yyyy, HH:mm", { locale: es })
                              : "—"}
                          </div>
                          {row.deletedByEmail ? (
                            <div className="text-xs text-slate-400">{row.deletedByEmail}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <PapeleraRowActions aspiranteId={row.id} nombreCompleto={nombre} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
