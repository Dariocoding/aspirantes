import { InventarioAreaView } from "@dashboard/inventario/_components/inventario-area-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canReadInventarioArea, canWriteInventarioArea } from "@src/lib/inventario/access";
import { INVENTARIO_AREAS } from "@src/lib/inventario/area";
import {
  getInventarioData,
  inventarioListHref,
  parseInventarioItemsSearchParams,
  type InventarioItemsSearchParams,
} from "@src/lib/inventario/queries";
import { getInventarioStats } from "@src/lib/inventario/stats";
import { redirect, unauthorized } from "next/navigation";

type Props = {
  searchParams: Promise<InventarioItemsSearchParams>;
};

export default async function InventarioRanchoPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  if (!canReadInventarioArea(ctx, "RANCHO")) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const canWrite = canWriteInventarioArea(ctx, "RANCHO");
  const listQuery = parseInventarioItemsSearchParams(await searchParams);
  const route = INVENTARIO_AREAS.RANCHO.route;

  const [inventario, stats] = await Promise.all([
    getInventarioData("RANCHO", listQuery),
    getInventarioStats("RANCHO"),
  ]);

  if (listQuery.page > inventario.totalPages && inventario.totalItems > 0) {
    redirect(
      inventarioListHref(route, {
        ...inventario.listQuery,
        page: inventario.totalPages,
      }),
    );
  }

  return (
    <InventarioAreaView
      area="RANCHO"
      items={inventario.items}
      movimientos={inventario.movimientos}
      canWrite={canWrite}
      stats={stats}
      listQuery={inventario.listQuery}
      pagination={{
        page: inventario.page,
        totalPages: inventario.totalPages,
        totalItems: inventario.totalItems,
        pageSize: inventario.pageSize,
      }}
      totalInArea={inventario.totalInArea}
      alertCount={inventario.alertCount}
    />
  );
}
