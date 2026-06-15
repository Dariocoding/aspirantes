import { ReportesRanchoView } from "@dashboard/inventario/rancho/reportes/_components/reportes-rancho-view";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canReadInventarioArea, canWriteInventarioArea } from "@src/lib/inventario/access";
import { canDeleteReporteRanchoEnLocalhost } from "@src/lib/inventario/reporte-rancho-dev";
import {
  getFechasReporteOptions,
  getReporteRanchoById,
  getReportesRanchoList,
  getReportesRanchoPreviews,
} from "@src/lib/inventario/reporte-rancho";
import { headers } from "next/headers";
import { redirect, unauthorized } from "next/navigation";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function InventarioRanchoReportesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) unauthorized();

  const ctx = authContextFromSession(session);
  if (!canReadInventarioArea(ctx, "RANCHO")) {
    redirect("/sin-permiso?motivo=administracion");
  }

  const { id } = await searchParams;
  const canWrite = canWriteInventarioArea(ctx, "RANCHO");
  const host = (await headers()).get("host");
  const canDeleteReportes = canDeleteReporteRanchoEnLocalhost(ctx, host);

  const [previewsByFecha, fechas, reportes, detalle] = await Promise.all([
    getReportesRanchoPreviews(),
    getFechasReporteOptions(),
    getReportesRanchoList(),
    id ? getReporteRanchoById(id) : Promise.resolve(null),
  ]);

  if (id && !detalle) {
    redirect("/inventario/rancho/reportes");
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Reportes del rancho</h1>
        <p className="mt-1 text-sm text-slate-600">
          Corte diario con existencias de ayer, movimientos del día y stock al reportar. Puede registrar hoy o
          hasta un día después.
        </p>
      </header>

      <ReportesRanchoView
        previewsByFecha={previewsByFecha}
        fechas={fechas}
        reportes={reportes}
        detalle={detalle}
        canWrite={canWrite}
        canDeleteReportes={canDeleteReportes}
      />
    </div>
  );
}
