import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { canReadInventario } from "@src/lib/inventario/access";
import { prisma } from "@src/lib/prisma";
import { getPresignedGetUrl } from "@src/lib/storage/s3";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!canReadInventario(authContextFromSession(session))) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { itemId } = await context.params;
  const item = await prisma.inventarioItem.findUnique({
    where: { id: itemId },
    select: { imagenKey: true },
  });

  if (!item?.imagenKey) {
    return NextResponse.json({ message: "Sin imagen" }, { status: 404 });
  }

  const url = await getPresignedGetUrl(item.imagenKey);
  return NextResponse.redirect(url, { status: 302 });
}
