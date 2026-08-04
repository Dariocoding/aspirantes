import { NextResponse } from "next/server";
import { auth } from "@src/auth";
import { authContextFromSession } from "@src/lib/auth/from-session";
import { hasPermission, Permission } from "@src/lib/auth/permissions";
import { prisma } from "@src/lib/prisma";
import { getPresignedGetUrl } from "@src/lib/storage/s3";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ aspiranteId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }
  if (!hasPermission(authContextFromSession(session), Permission.ASPIRANTES_READ)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { aspiranteId } = await context.params;
  const aspirante = await prisma.aspirante.findUnique({
    where: { id: aspiranteId },
    select: { fotoKey: true },
  });

  if (!aspirante?.fotoKey) {
    return NextResponse.json({ message: "Sin imagen" }, { status: 404 });
  }

  const url = await getPresignedGetUrl(aspirante.fotoKey);
  return NextResponse.redirect(url, { status: 302 });
}
