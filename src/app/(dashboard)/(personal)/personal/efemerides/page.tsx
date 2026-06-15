import { EfemeridesView } from "@dashboard/efemerides/_components/efemerides-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { unauthorized } from "next/navigation";

export default async function EfemeridesPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  const canWrite = hasPermission(ctx, Permission.EFEMERIDES_WRITE);

  const efemerides = await prisma.efemeride.findMany({
    orderBy: [{ mes: "asc" }, { dia: "asc" }],
  });

  return <EfemeridesView efemerides={efemerides} canWrite={canWrite} />;
}
