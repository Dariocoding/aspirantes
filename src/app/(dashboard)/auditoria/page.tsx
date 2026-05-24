import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isAdmin } from "@/lib/auth/roles";
import { redirect, unauthorized } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage() {
  const session = await auth();
  if (!session?.user) unauthorized();
  if (!isAdmin(session.user.role)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Auditoría</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Últimos 200 eventos registrados (aspirantes, convocatorias y exportaciones del censo). La IP y el agente
            provienen de la petición HTTP cuando están disponibles.
          </p>
        </div>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Panel
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase text-slate-600">
                Fecha (UTC)
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-600">Usuario</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-600">Acción</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-600">Entidad</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-600">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                  Aún no hay registros de auditoría.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-100">
                  <TableCell className="whitespace-nowrap font-mono text-xs text-slate-700">
                    {log.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </TableCell>
                  <TableCell className="max-w-[200px] text-sm text-slate-800">
                    <span className="font-medium">{log.user?.name ?? log.userEmail ?? "—"}</span>
                    {log.user?.email ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{log.user.email}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-800">{log.action}</TableCell>
                  <TableCell className="max-w-xs text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{log.entityType}</span>
                    {log.entityId ? (
                      <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-500">
                        {log.entityId}
                      </span>
                    ) : null}
                    {log.metadata != null ? (
                      <span className="mt-1 block max-h-16 overflow-y-auto rounded border border-slate-100 bg-slate-50 p-1.5 font-mono text-[10px] leading-snug text-slate-600">
                        {JSON.stringify(log.metadata)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-slate-600">{log.ip ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
