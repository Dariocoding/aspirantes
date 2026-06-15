import { auth } from "@src/auth";
import { AuditoriaView } from "@dashboard/sistema/auditoria/_components/auditoria-view";
import { AUDIT_PAGE_SIZE } from "@dashboard/sistema/auditoria/_components/constants";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { getSistemaAuditStats } from "@src/lib/sistema/stats";
import { prisma } from "@src/lib/prisma";
import { redirect, unauthorized } from "next/navigation";

export const dynamic = "force-dynamic";

const PAGE_SIZE = AUDIT_PAGE_SIZE;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) unauthorized();
  if (!hasPermission(authContextFromSession(session), Permission.AUDIT_READ)) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const spRaw = await searchParams;
  const pageParam = spRaw.page;
  const pageRaw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Math.max(1, Number(pageRaw) || 1);

  const [total, logs, stats] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    getSistemaAuditStats(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages && total > 0) {
    const params = new URLSearchParams();
    if (totalPages > 1) params.set("page", String(totalPages));
    const qs = params.toString();
    redirect(qs ? `/sistema/auditoria?${qs}` : "/sistema/auditoria");
  }

  return (
    <AuditoriaView logs={logs} stats={stats} page={page} totalPages={totalPages} total={total} />
  );
}
