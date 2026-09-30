import { Suspense } from "react";
import { CensusFilters, CensusTitle, CensusToolbar, ConvocatoriaLine } from "@dashboard/aspirantes/_components/census-chrome";
import { auth } from "@src/auth";
import { Card, CardContent } from "@src/components/ui/card";
import { authContextFromSession } from "@src/lib/auth/from-session";
import type { CondicionCensusCounts } from "@src/lib/aspirantes/condicion-militar";
import { canWrite } from "@src/lib/auth/roles";
import { prisma } from "@src/lib/prisma";

export default async function CensoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return children;

  const convocatorias = await prisma.convocatoria.findMany({
    orderBy: [{ anio: "desc" }, { createdAt: "desc" }],
  });
  if (!convocatorias.length) return children;

  const ctx = authContextFromSession(session);
  const write = canWrite(ctx);
  const ids = convocatorias.map((c) => c.id);
  const [pelotones, membretes, papeleraCount, counts, condicionGrupos] = await Promise.all([
    prisma.peloton.findMany({
      where: { convocatoriaId: { in: ids } },
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, nombre: true, convocatoriaId: true },
    }),
    prisma.membrete
      .findMany({
        orderBy: [{ isDefault: "desc" }, { nombre: "asc" }],
        select: { id: true, nombre: true, isDefault: true },
      })
      .catch(() => []),
    write ? prisma.aspirante.count({ where: { deletedAt: { not: null } } }) : Promise.resolve(0),
    prisma.aspirante.groupBy({
      by: ["convocatoriaId"],
      where: { convocatoriaId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.aspirante.groupBy({
      by: ["convocatoriaId", "condicionMilitar"],
      where: { convocatoriaId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const opciones = convocatorias.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    anio: c.anio,
    activa: c.activa,
  }));
  const defaultConvocatoriaId = convocatorias[0]!.id;
  const countByConvocatoria = Object.fromEntries(counts.map((row) => [row.convocatoriaId, row._count._all]));
  const condicionCounts: Record<string, CondicionCensusCounts> = {};
  for (const id of ids) condicionCounts[id] = { soldado: 0, sargento: 0, sin: 0 };
  for (const row of condicionGrupos) {
    const bucket = condicionCounts[row.convocatoriaId] ?? { soldado: 0, sargento: 0, sin: 0 };
    if (row.condicionMilitar === "SOLDADO_ACTIVO") bucket.soldado += row._count._all;
    else if (row.condicionMilitar === "SARGENTO_ACTIVO") bucket.sargento += row._count._all;
    else bucket.sin += row._count._all;
    condicionCounts[row.convocatoriaId] = bucket;
  }

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 flex-col gap-1">
        <CensusTitle />
        <Suspense fallback={<div className="h-5 pl-7" />}>
          <ConvocatoriaLine convocatorias={opciones} defaultConvocatoriaId={defaultConvocatoriaId} />
        </Suspense>
      </div>
      <Card className="shadow-sm shadow-slate-900/5 ring-slate-200/80">
        <Suspense fallback={<div className="h-36 border-b border-slate-200/80 bg-slate-50" />}>
          <CensusToolbar
            write={write}
            convocatorias={opciones}
            defaultConvocatoriaId={defaultConvocatoriaId}
            pelotones={pelotones}
            papeleraCount={papeleraCount}
            membretes={membretes}
            counts={countByConvocatoria}
          />
        </Suspense>
        <CardContent className="space-y-0 p-0">
          <Suspense fallback={<div className="h-24 border-b border-slate-200/90 bg-slate-50" />}>
            <CensusFilters
              convocatorias={opciones}
              defaultConvocatoriaId={defaultConvocatoriaId}
              pelotones={pelotones}
              condicionCounts={condicionCounts}
            />
          </Suspense>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
