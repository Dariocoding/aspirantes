import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canReadInventarioArea } from "@src/lib/inventario/access";
import { getReporteRanchoById, resumirReporteLineas } from "@src/lib/inventario/reporte-rancho";
import { InventarioReporteRanchoPdfDocument } from "@src/lib/pdf/inventario-reporte-rancho-document";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  const ctx = authContextFromSession(session);
  if (!canReadInventarioArea(ctx, "RANCHO")) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await context.params;
  const reporte = await getReporteRanchoById(id);

  if (!reporte) {
    return NextResponse.json({ message: "Reporte no encontrado" }, { status: 404 });
  }

  const autor = reporte.user.name ?? reporte.user.email ?? "Usuario";
  const fechaTexto = format(reporte.fecha, "d 'de' MMMM yyyy", { locale: es });
  const generadoTexto = format(reporte.createdAt, "d MMM yyyy, HH:mm", { locale: es });
  const resumen = resumirReporteLineas(reporte.lineas);
  const dateSafe = format(reporte.fecha, "yyyy-MM-dd");

  const doc = createElement(InventarioReporteRanchoPdfDocument, {
    fechaTexto,
    generadoTexto,
    autor,
    notas: reporte.notas,
    lineas: reporte.lineas,
    movimientos: reporte.movimientos,
    resumen,
  });

  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0]);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte-rancho-${dateSafe}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
