import { EfemeridesView } from "@/components/efemerides/efemerides-view";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function EfemeridesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role;

  const efemerides = await prisma.efemeride.findMany({
    orderBy: [{ mes: "asc" }, { dia: "asc" }],
  });

  return <EfemeridesView efemerides={efemerides} role={role} />;
}
