import { MembretesView, type MembreteRow } from "@dashboard/membretes/_components/membretes-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canWrite } from "@src/lib/auth/roles";
import { isMembreteLogoKind } from "@src/lib/membrete";
import { prisma } from "@src/lib/prisma";
import { unauthorized } from "next/navigation";

export default async function MembretesPage() {
  const session = await auth();
  if (!session?.user) unauthorized();

  const write = canWrite(authContextFromSession(session));
  const rows = await prisma.membrete.findMany({
    orderBy: [{ isDefault: "desc" }, { nombre: "asc" }],
  });

  const membretes: MembreteRow[] = rows.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    lineas: m.lineas,
    logoIzq: isMembreteLogoKind(m.logoIzq) ? m.logoIzq : "none",
    logoDer: isMembreteLogoKind(m.logoDer) ? m.logoDer : "none",
    isDefault: m.isDefault,
  }));

  return <MembretesView membretes={membretes} canWrite={write} />;
}
